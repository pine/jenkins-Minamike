import page from 'page'
import smartly from '../vendor/scrollsmartly'

require('./main.css')
require('./components/footer')
require('./components/header')

smartly.all()

page('/', require('./routes/root'))
page('/*', require('./routes/content'))
page({click: false, popstate: false})
