set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

repo_root := "/Users/sascha/Code/z-dl"
koreader_plugins_dir := "/Users/sascha/Code/koreader/plugins"
sake_src := repo_root + "/koreaderPlugins/sake.koplugin"
sake_updater_src := repo_root + "/koreaderPlugins/sakeUpdater.koplugin"
sake_dst := koreader_plugins_dir + "/sake.koplugin"
sake_updater_dst := koreader_plugins_dir + "/sakeUpdater.koplugin"

default:
  @just --list

link-koreader-plugins:
  rm -rf {{sake_dst}} {{sake_updater_dst}}
  ln -s {{sake_src}} {{sake_dst}}
  ln -s {{sake_updater_src}} {{sake_updater_dst}}
  ls -la {{sake_dst}} {{sake_updater_dst}}

unlink-koreader-plugins:
  rm -rf {{sake_dst}} {{sake_updater_dst}}

