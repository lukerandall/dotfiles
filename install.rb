#!/usr/bin/env ruby
# frozen_string_literal: true

dirs = %w[atuin bin bat fish kitty mise nvim]
config_files = %w[starship.toml]
ignored = %w[
  install.rb README.md Brewfile Brewfile.lock.json Brewfile.local Brewfile.local.lock.json Fonts.brewfile
  Fonts.brewfile.lock.json print_settings.rb settings.json settings.sh setup.sh keybindings.json
  aws-sso
]

home = File.expand_path('~')

Dir['*'].each do |file|
  next if dirs.include?(file) || config_files.include?(file) || ignored.include?(file)

  target = File.join(home, ".#{File.basename(file)}")
  puts `ln -svf #{File.expand_path file} #{target}`
end

puts
`mkdir -p ~/.config`
config_files.each do |file|
  puts `ln -svf #{File.expand_path file} #{home}/.config/#{file}`
end

puts
dirs.each do |dir|
  next if dir == 'bin'

  puts `ln -svf #{File.expand_path dir} #{home}/.config`
end

puts
Dir['bin/*'].each do |file|
  puts `ln -svf #{File.expand_path file} #{home}/.local/#{file}`
end
