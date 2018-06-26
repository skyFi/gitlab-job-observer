const {Notification} = require('electron')
const path = require('path')

module.exports = function(option) {
	const isSupported = Notification.isSupported()
	if (isSupported) {
		let myNotification = new Notification(Object.assign({}, {
			icon: path.join(__dirname, '../img/icon.png')
		}, option || {}))
		  
    myNotification.show()	
	}
}
