#!/usr/bin/env ruby
#
## from http://errtheblog.com/posts/89-huba-huba
#
home = File.expand_path('~')

dirs = %w[bat fish nvim]
config_files = %w[starship.toml]
ignored = %w[
  install.rb README.md Brewfile Brewfile.lock.json Brewfile.local Brewfile.local.lock.json Fonts.brewfile
  Fonts.brewfile.lock.json print_settings.rb settings.json settings.sh setup.sh keybindings.json
]

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
  puts `ln -svf #{File.expand_path dir} #{home}/.config`
end
