# IRBRC file by Iain Hecker, http://iain.nl
# put all this in your ~/.irbrc
require 'rubygems'

alias q exit

# Easily print methods local to an object's class
class Object
  def local_methods
    (methods - Object.instance_methods).sort
  end
end

ANSI = {}
ANSI[:RESET] = "\e[0m"
ANSI[:BOLD] = "\e[1m"
ANSI[:UNDERLINE] = "\e[4m"
ANSI[:LGRAY] = "\e[0;37m"
ANSI[:GRAY] = "\e[1;30m"
ANSI[:RED] = "\e[31m"
ANSI[:GREEN] = "\e[32m"
ANSI[:YELLOW] = "\e[33m"
ANSI[:BLUE] = "\e[34m"
ANSI[:MAGENTA] = "\e[35m"
ANSI[:CYAN] = "\e[36m"
ANSI[:WHITE] = "\e[37m"

# Build a simple colorful IRB prompt
IRB.conf[:PROMPT][:SIMPLE_COLOR] = {
  PROMPT_I: "#{ANSI[:BLUE]}>>#{ANSI[:RESET]} ",
  PROMPT_N: "#{ANSI[:BLUE]}>>#{ANSI[:RESET]} ",
  PROMPT_C: "#{ANSI[:RED]}?>#{ANSI[:RESET]} ",
  PROMPT_S: "#{ANSI[:YELLOW]}?>#{ANSI[:RESET]} ",
  RETURN: "#{ANSI[:GREEN]}=>#{ANSI[:RESET]} %s\n",
  AUTO_INDENT: true
}
# IRB.conf[:PROMPT_MODE] = :SIMPLE_COLOR
IRB.conf[:PROMPT_MODE] = :SIMPLE

# IRB Options
IRB.conf[:AUTO_INDENT] = true
IRB.conf[:SAVE_HISTORY] = 1000
IRB.conf[:EVAL_HISTORY] = 200

# reload this .irbrc
def IRB.reload
  load __FILE__
end

# Loading extensions of the console. This is wrapped
# because some might not be included in your Gemfile
# and errors will be raised
def extend_console(name, care = true, required = true)
  if care
    require name if required
    yield if block_given?
    $console_extensions << "#{ANSI[:GREEN]}#{name}#{ANSI[:RESET]}"
  else
    $console_extensions << "#{ANSI[:GRAY]}#{name}#{ANSI[:RESET]}"
  end
rescue LoadError
  $console_extensions << "#{ANSI[:RED]}#{name}#{ANSI[:RESET]}"
end
$console_extensions = []

# Wirble is a gem that handles coloring the IRB
# output and history
extend_console 'wirble' do
  Wirble.init
  Wirble.colorize
end

# When you're using Rails 3 console, show queries in the console
extend_console 'rails3', defined?(ActiveSupport::Notifications), false do
  $odd_or_even_queries = false
  ActiveSupport::Notifications.subscribe('sql.active_record') do |*args|
    $odd_or_even_queries = !$odd_or_even_queries
    color = $odd_or_even_queries ? ANSI[:CYAN] : ANSI[:MAGENTA]
    event = ActiveSupport::Notifications::Event.new(*args)
    time = '%.1fms' % event.duration
    name = event.payload[:name]
    sql = event.payload[:sql].gsub("\n", ' ').squeeze(' ')
    # puts " #{ANSI[:UNDERLINE]}#{color}#{name} (#{time})#{ANSI[:RESET]} #{sql}"
  end
end

# Add a method pm that shows every method on an object
# Pass a regex to filter these
extend_console 'pm', true, false do
  def pm(obj, *options) # Print methods
    methods = obj.methods
    methods -= Object.methods unless options.include? :more
    filter = options.select { |opt| opt.is_a? Regexp }.first
    methods = methods.select { |name| name =~ filter } if filter

    data = methods.sort.collect do |name|
      method = obj.method(name)
      if method.arity == 0
        args = '()'
      elsif method.arity > 0
        n = method.arity
        args = "(#{(1..n).collect { |i| "arg#{i}" }.join(', ')})"
      elsif method.arity < 0
        n = -method.arity
        args = "(#{(1..n).collect { |i| "arg#{i}" }.join(', ')}, ...)"
      end
      klass = Regexp.last_match(1) if method.inspect =~ /Method: (.*?)#/
      [name.to_s, args, klass]
    end
    max_name = data.collect { |item| item[0].size }.max
    max_args = data.collect { |item| item[1].size }.max
    data.each do |item|
      print " #{ANSI[:YELLOW]}#{item[0].to_s.rjust(max_name)}#{ANSI[:RESET]}"
      print "#{ANSI[:BLUE]}#{item[1].ljust(max_args)}#{ANSI[:RESET]}"
      print " #{ANSI[:GRAY]}#{item[2]}#{ANSI[:RESET]}\n"
    end
    data.size
  end
end

extend_console 'interactive_editor' do
  # no configuration needed
end

# Show results of all extension-loading
puts "#{ANSI[:GRAY]}~> Console extensions:#{ANSI[:RESET]} #{$console_extensions.join(' ')}#{ANSI[:RESET]}"

# Happy clipboarding
class Clippy
  def paste
    IO.read('|pbpaste').chomp
  end

  def copy(string)
    IO.popen('pbcopy', 'w') do |p|
      p.puts(string)
    end
    string
  end

  def <<(string)
    copy(paste + string)
  end

  def clear
    copy('')
  end

  def to_s
    paste
  end

  def inspect
    to_s
  end
end

def clippy
  @clippy ||= Clippy.new
  @clippy.copy yield if block_given?
  @clippy
end
