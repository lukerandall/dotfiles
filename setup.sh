#!/bin/sh

echo "Installing dotfiles"
./install.rb

echo "Installing homebrew"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo "Installing apps"
brew bundle

echo "Applying macOS settings"
./settings.sh
