# Changelog
All notable changes to this project will be documented in this file.


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Added 
- support to currently stable Node.js version (v18.x)

### Changed
- bumped to `modbus-herdsman-converters` 2.0.7
- bumped dependencies `modbus-serial`, `lodash`, `git-last-commit`, `mkdir-recursive` `winston`
- bumped dev dependencies `mocha`, `nodemon`,`eslint`, `sinon`

### Removed
- compatibility with deprecated Node.js versions (v10.x,v12.x)

## [1.1.6] - 2023-01-12
### Changed
- Modbus integration period to 30 seconds

## [1.1.4] - 2022-05-12
### Changed
- Support for linux/amd64 docker image
## [1.1.3] - 2022-05-05
### Changed
- Support for both FC3 and FC4 modbus functions
- Linted source code
- Fixed deprecated set-env for github actions
  
## [1.1.2] - 2020-04-28
### Changed
- Removing in-memory instance on force remove

## [1.1.1] - 2020-04-20
### Added
- bumped to `modbus-herdsman-converters` 2.0.3
- first test
- `sinon` dev dependency

## [1.1.0] - 2020-04-20
### Added
- passing to `post` function interpreted and buffer value

## [1.0.1] - 2020-04-15
### Changed
- Fixed build script for prod env

## [1.0.0] - 2020-04-15
### Added
- First public version

