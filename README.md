# jenkins-Minamike [![Build Status](http://img.shields.io/travis/pine613/jenkins-Minamike/master.svg?style=flat-square)](https://travis-ci.org/pine613/jenkins-Minamike) [![Dependency Status](https://img.shields.io/david/pine613/jenkins-Minamike.svg?style=flat-square)](https://david-dm.org/pine613/jenkins-Minamike) [![devDependency Status](https://img.shields.io/david/dev/pine613/jenkins-Minamike.svg?style=flat-square)](https://david-dm.org/pine613/jenkins-Minamike#info=devDependencies)

**EXPERIMENTAL**

## What's this ?
Minamike like Jenkins theme.

## Develop environment

- Node v5.10.1
- [Webpack](https://webpack.github.io/)
- [Babel](https://babeljs.io/) 6.x
- [Postcss](http://postcss.org/)

## Getting started
1. Clone git repository
```
$ mkdir -p ~/project/jenkins-Minamike
$ git clone git@github.com:pine613/jenkins-Minamike.git ~/project/jenkins-Minamike
```
2. Build
```
$ cd ~/jenkins-Minamike
$ npm install
$ npm run build
```
3. Create symbolic link
```
$ ln -s ~/project/jenkins-Minamike/public ~/.jenkins/userContent/minamike
```
4. Install [Simple Theme Plugin](https://wiki.jenkins-ci.org/display/JENKINS/Simple+Theme+Plugin)
5. Set `/userContent/minamike/bundle.js` in URL of theme JS

## Lint

```
$ npm test
```

## License
MIT License
