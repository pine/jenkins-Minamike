import $ from 'jquery'
require('jquery-ui')

global.jQuery = $
require('../../../vendor/jquery.scrollfollow.js')

function setupSidebar() {
  $('#side-panel').scrollFollow({
    speed: 600,
    offset: 0
  })
}

function setupLogo() {
  $('#side-panel').append(require('./logo.jade'))
}

function setupHeading() {
  const heading = $('#main-panel > h1')
  if (heading.length == 1) return // header already existed

  const title = document.title.replace(' [Jenkins]', '')
  $('#main-panel').prepend($('<h1 />').text(title))
}

function setupQueue() {
  const elements = $('#buildQueue, #executors, #buildHistoryPage').detach()

  if (elements.length > 0) {
    $('#main-panel').append(require('./queue.jade'))
    $('.mk-queue').append(elements)
  }
}

function setupFooter() {
  $('body').prepend('<a name="#pagetop" id="pagetop"></a>')
  $('#main-panel').append(require('./footer.jade'))
}

module.exports = function () {
  require('./index.css')
  $(() => {
    setupSidebar()
    setupLogo()
    setupHeading()
    setupQueue()
    setupFooter()
  })
}
