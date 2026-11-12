#!/usr/bin/env ruby
# frozen_string_literal: true

# Symlinks the files in this repository into a home directory.
class DotfilesLinker
  DIRS = %w[atuin bin bat fish ghostty jj jjui mise nvim shade zellij].freeze
  CONFIG_FILES = %w[starship.toml].freeze
  SPARSE_DIRS = %w[claude].freeze
  IGNORED = %w[
    link_dotfiles.rb README.md Brewfile Brewfile.lock.json Brewfile.local Brewfile.local.lock.json Fonts.brewfile
    Fonts.brewfile.lock.json print_settings.rb settings.json settings.sh setup.sh keybindings.json
    aws-sso test
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
  end

  private

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

  def link_sparse_dirs
    SPARSE_DIRS.each do |sparse_dir|
      `mkdir -p #{home}/.#{sparse_dir}`
      Dir[path(sparse_dir, '*')].each do |file|
        if File.directory?(file)
          ln(file, "#{home}/.#{sparse_dir}")
        else
          ln(file, "#{home}/.#{sparse_dir}/#{File.basename(file)}")
        end
      end
    end
  end
end

DotfilesLinker.new(repo: __dir__, home: File.expand_path('~')).run if $PROGRAM_NAME == __FILE__
