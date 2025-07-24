class Object
  # Easily print methods local to an object's class
  def local_methods
    (methods - Object.instance_methods).sort
  end
end

ANSI ||= {}
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
