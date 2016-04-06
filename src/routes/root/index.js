import $ from 'jquery'

function disableBody() {
  const head = $('head')
  const style = document.createElement('style')
  const styleText = '#page-body { display: none }'
  style.appendChild(document.createTextNode(styleText))
  head.append(style)
}

function insert() {
  if ($('.mk-index')[0]) return

  const pageBody = $('#page-body')
  if (!pageBody[0]) return

  pageBody.find('#side-panel').hide()
  pageBody.find('#main-panel').hide()
  pageBody.append(require('./index.jade'))
  pageBody.show()

  const mkIndex = $('.mk-index')

  const tasks = $('#tasks')
  const tasksClone = tasks.clone()
  tasks.removeAttr('id')
  mkIndex.append(tasksClone)
}

module.exports = function () {
  require('./index.css')

  disableBody()
  $(insert)
}
