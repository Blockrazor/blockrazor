const dep = new Tracker.Dependency

const moment = () => ({
    fromNow: () => {
    	dep.depend()

    	return ''
	},
    diff: () => {
        dep.depend()

        return 0
    },
    format: () => {
        dep.depend()

        return ''
    },
    change: () => dep.changed() // in order to retain reactivity, use this to notify helpers that they can now use moment to parse dates
})

export { moment }