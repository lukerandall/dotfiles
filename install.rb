#!/usr/bin/env ruby
#
## from http://errtheblog.com/posts/89-huba-huba
#
home = File.expand_path('~')

Dir['*'].each do |file|
  next if file =~ /install|readme.md|brewfile|starship.toml|bat|fish/i
  target = File.join(home, ".#{File.basename(file)}")
  puts `ln -svf #{File.expand_path file} #{target}`
end

`mkdir -p ~/.config`
puts `ln -svf #{File.expand_path "starship.toml"} #{home}/.config/starship.toml`
puts `ln -svf #{File.expand_path "fish"} #{home}/.config`
puts `ln -svf #{File.expand_path "bat"} #{home}/.config`
