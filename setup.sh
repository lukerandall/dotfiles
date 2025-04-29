#!/bin/sh

echo "Installing homebrew"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo "Installing apps"
brew bundle

echo "Linking dotfiles"
./link_dotfiles.rb

echo "Applying macOS settings"
./settings.sh
