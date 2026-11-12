#!/usr/bin/env ruby
# frozen_string_literal: true

require 'fileutils'

# Symlinks the files in this repository into a home directory.
class DotfilesLinker
  DIRS = %w[atuin bin bat fish ghostty jj jjui mise nvim shade zellij].freeze
  CONFIG_FILES = %w[starship.toml].freeze
  SPARSE_DIRS = %w[claude].freeze
  IGNORED = %w[
    link_dotfiles.rb README.md Brewfile Brewfile.lock.json Brewfile.local Brewfile.local.lock.json Fonts.brewfile
    Fonts.brewfile.lock.json print_settings.rb settings.json settings.sh setup.sh keybindings.json
    aws-sso skills test
  ].freeze

  def initialize(repo:, home:, out: $stdout)
    @repo = repo
    @home = home
    @out = out
  end

  def run
    link_dotfiles
    link_config_files
    link_config_dirs
    link_bin
    link_sparse_dirs
    link_skills
  end

  # Links each skills/<name> folder to ~/.agents/skills/<name>, which Claude Code and Codex read, replacing
  # whatever is there. Links ~/.claude/skills to ~/.agents/skills when ~/.claude/skills does not exist.
  def link_skills
    FileUtils.mkdir_p(agent_skills)
    Dir[path('skills', '*')].select { |skill| File.directory?(skill) }.each do |skill|
      target = File.join(agent_skills, File.basename(skill))
      remove(target)
      symlink(skill, target)
    end
    link_claude_skills
  end

  private

  def agent_skills = File.join(home, '.agents', 'skills')

  def link_claude_skills
    claude_skills = File.join(home, '.claude', 'skills')
    return if File.exist?(claude_skills) || File.symlink?(claude_skills)

    FileUtils.mkdir_p(File.dirname(claude_skills))
    symlink(agent_skills, claude_skills)
  end

  def symlink(source, target)
    File.symlink(source, target)
    out.puts "#{target} -> #{source}"
  end

  # Removes a symlink without following it, or a real file or folder with its contents.
  def remove(target)
    if File.symlink?(target)
      File.unlink(target)
    else
      FileUtils.rm_rf(target)
    end
  end

  attr_reader :repo, :home, :out

  def path(*parts) = File.join(repo, *parts)

  def ln(source, target)
    out.puts `ln -svf #{source} #{target}`
  end

  def link_dotfiles
    Dir[path('*')].each do |file|
      name = File.basename(file)
      next if DIRS.include?(name) || CONFIG_FILES.include?(name) || SPARSE_DIRS.include?(name) || IGNORED.include?(name)

      ln(file, File.join(home, ".#{name}"))
    end
  end

  def link_config_files
    out.puts `mkdir -p #{home}/.config`
    CONFIG_FILES.each { |file| ln(path(file), "#{home}/.config/#{file}") }
  end

  def link_config_dirs
    DIRS.each do |dir|
      next if dir == 'bin'

      ln(path(dir), "#{home}/.config")
    end
  end

  def link_bin
    out.puts
    Dir[path('bin', '*')].each do |file|
      ln(file, "#{home}/.local/bin/#{File.basename(file)}")
    end
  end

  # Links each entry of a sparse folder, such as claude/, into the matching folder in home, such as ~/.claude.
  # A real file or folder already there is the user's own, so it is kept and a warning is printed.
  def link_sparse_dirs
    SPARSE_DIRS.each do |sparse_dir|
      FileUtils.mkdir_p(File.join(home, ".#{sparse_dir}"))
      Dir[path(sparse_dir, '*')].each do |file|
        link_unless_real(file, File.join(home, ".#{sparse_dir}", File.basename(file)))
      end
    end
  end

  def link_unless_real(source, target)
    if File.exist?(target) && !File.symlink?(target)
      out.puts "warning: kept #{target}, which is not a symlink; remove it to link #{source}"
    else
      remove(target)
      symlink(source, target)
    end
  end
end

DotfilesLinker.new(repo: __dir__, home: File.expand_path('~')).run if $PROGRAM_NAME == __FILE__
