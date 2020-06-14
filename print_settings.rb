#!/usr/bin/env ruby

require 'json'

json = JSON.parse(File.read('settings.json').gsub(/\/\/.*$/, ''))
keys = json.keys.select { |k| k =~ /vim\..*Mode/ }
keys.each do |key|
  puts ['#', key.gsub('ModeKeyBindingsNonRecursive', '').gsub('vim.', ''), 'mode'].join(' ').upcase
  puts
  puts "```"
  json[key].each do |cmd|
    shortcut = cmd['before'].join(" ").ljust(22)
    commands = cmd['commands']
    commands = commands.to_s if commands

    full_desc = [
      cmd['description'],
      commands,
      cmd['after'].to_s
    ].compact

    desc = full_desc.shift.ljust(40)

    # other_desc = full_desc.join(" ")
    other_desc = nil

    output = [shortcut, desc, other_desc ]
    puts output.join(" ").strip
  end
  puts "```"
  puts
end
