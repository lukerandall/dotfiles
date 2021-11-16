#!/bin/sh

echo "Installing dotfiles"
./install.rb

echo "Installing Xcode and Rosetta"
xcode-select --install
sudo xcodebuild -license accept
/usr/sbin/softwareupdate --install-rosetta --agree-to-license

echo "Installing homebrew"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo "Installing apps"
brew bundle

echo "Installing nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

echo "Applying macOS settings"
./settings.sh
