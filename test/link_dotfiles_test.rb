# frozen_string_literal: true

require 'minitest/autorun'
require 'fileutils'
require 'tmpdir'
require 'stringio'
require_relative '../link_dotfiles'

class LinkDotfilesTest < Minitest::Test
  REPO = File.expand_path('..', __dir__)
  SKILLS = Dir[File.join(REPO, 'skills', '*')].select { |path| File.directory?(path) }.map { File.basename(it) }

  def setup
    @home = Dir.mktmpdir('link-dotfiles-home')
    FileUtils.mkdir_p(File.join(@home, '.local', 'bin'))
  end

  def teardown
    FileUtils.rm_rf(@home)
  end

  def link(only: nil)
    @out = StringIO.new
    linker = DotfilesLinker.new(repo: REPO, home: @home, out: @out)
    only == :skills ? linker.link_skills : linker.run
  end

  def skills_home = File.join(@home, '.agents', 'skills')

  def test_the_repository_has_skills
    refute_empty SKILLS
  end

  def test_links_each_skill_into_agents_skills
    link

    SKILLS.each do |name|
      target = File.join(skills_home, name)
      assert File.symlink?(target), "#{target} is not a symlink"
      assert_equal File.join(REPO, 'skills', name), File.readlink(target)
    end
  end

  def test_links_only_skill_folders
    link

    refute File.exist?(File.join(skills_home, 'README.md'))
  end

  def test_replaces_a_real_skill_folder_with_the_symlink
    name = SKILLS.first
    folder = File.join(skills_home, name)
    FileUtils.mkdir_p(folder)
    File.write(File.join(folder, 'SKILL.md'), 'old copy')

    link

    assert File.symlink?(folder)
    assert_equal File.join(REPO, 'skills', name), File.readlink(folder)
  end

  def test_replaces_a_symlink_to_another_folder
    name = SKILLS.first
    elsewhere = File.join(@home, 'elsewhere')
    FileUtils.mkdir_p(elsewhere)
    File.write(File.join(elsewhere, 'SKILL.md'), 'kept')
    FileUtils.mkdir_p(skills_home)
    File.symlink(elsewhere, File.join(skills_home, name))

    link

    assert_equal File.join(REPO, 'skills', name), File.readlink(File.join(skills_home, name))
    assert_equal 'kept', File.read(File.join(elsewhere, 'SKILL.md'))
  end

  def test_leaves_other_skills_alone
    other = File.join(skills_home, 'tasks')
    FileUtils.mkdir_p(other)

    link

    assert File.directory?(other)
    refute File.symlink?(other)
  end

  def test_links_claude_skills_to_agents_skills_when_missing
    link

    claude_skills = File.join(@home, '.claude', 'skills')
    assert File.symlink?(claude_skills)
    assert_equal skills_home, File.readlink(claude_skills)
  end

  def test_keeps_an_existing_claude_skills_folder
    claude_skills = File.join(@home, '.claude', 'skills')
    FileUtils.mkdir_p(claude_skills)

    link

    refute File.symlink?(claude_skills)
  end

  def test_does_not_link_skills_or_tests_as_dotfiles
    link

    refute File.symlink?(File.join(@home, '.skills'))
    refute File.symlink?(File.join(@home, '.test'))
  end

  def test_links_skills_alone
    link(only: :skills)

    assert File.symlink?(File.join(skills_home, SKILLS.first))
    assert File.symlink?(File.join(@home, '.claude', 'skills'))
    refute File.symlink?(File.join(@home, '.gitconfig'))
  end

  def test_keeps_a_real_file_in_a_linked_folder_and_warns
    settings = File.join(@home, '.claude', 'settings.json')
    FileUtils.mkdir_p(File.dirname(settings))
    File.write(settings, '{"mine": true}')

    link

    refute File.symlink?(settings)
    assert_equal '{"mine": true}', File.read(settings)
    assert_match(/#{Regexp.escape(settings)}/, @out.string)
  end

  def test_updates_a_stale_symlink_in_a_linked_folder
    claude_md = File.join(@home, '.claude', 'CLAUDE.md')
    FileUtils.mkdir_p(File.dirname(claude_md))
    File.symlink(File.join(@home, 'old-CLAUDE.md'), claude_md)

    link

    assert_equal File.join(REPO, 'claude', 'CLAUDE.md'), File.readlink(claude_md)
  end

  def test_still_links_dotfiles_into_home
    link

    assert_equal File.join(REPO, 'gitconfig'), File.readlink(File.join(@home, '.gitconfig'))
  end
end
