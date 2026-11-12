# Agent skills

Claude Code and Codex read skills from `~/.agents/skills`, one folder per
skill. Claude Code reaches them through the symlink
`~/.claude/skills -> ~/.agents/skills`. The folders in `~/.agents/skills` come
from several places, and each kind is updated in its own way.

## Skills kept in these dotfiles

Each folder in this directory is a skill. `link_dotfiles.rb` symlinks
`skills/<name>` to `~/.agents/skills/<name>`, and replaces any folder or
symlink that is already there under that name. It also creates
`~/.claude/skills -> ~/.agents/skills` when `~/.claude/skills` does not exist.
To link only the skills, run:

    ruby -r ./link_dotfiles.rb -e 'DotfilesLinker.new(repo: Dir.pwd, home: Dir.home).link_skills'

These skills started as copies of skills from github.com/mattpocock/skills.
Several have been changed to write board records (tasks, decisions, questions
and controls) in place of GitHub issues or files in the repository. Edit them
here, never in `~/.agents/skills`, and never reinstall them with
`npx skills`, which would replace the edits.

`test/link_dotfiles_test.rb` checks the linking against a temporary home:

    deadband run --label dotfiles-test -- ruby test/link_dotfiles_test.rb

## Board's skills

Board ships a skill for each of its plugins, such as `tasks`, `plans`,
`changes` and `controls`. `board skills install` writes them into
`~/.claude/skills`, which is the same folder as `~/.agents/skills`. Each of
these folders holds a `.board-skill` file that names the Board version that
wrote it. Run `board skills install` again after each upgrade of Board, and
`board skills list` to see which are installed.

## Skills from the Board repository

Some skills live in the Board repository's `skills/` folder, such as `work`,
`handoff` and the `audit` skills. Each one is a symlink from
`~/.agents/skills/<name>` to `~/Code/board/skills/<name>`, so it changes when
that checkout changes.

## vq skills

The vq skills, such as `vq` and `vq-task`, live in `~/.skills`. Each one is a
symlink from `~/.agents/skills/<name>` to `~/.skills/<name>`.

## Other skills

A few tools install their own skill, such as `deadband`, `mxv`, `starmap` and
`soundcheck`; the skill's frontmatter names the tool and its version under
`metadata`. The AWS skills hold a `.aws-skill-metadata` file. Update these
skills through the tool that installed them.
