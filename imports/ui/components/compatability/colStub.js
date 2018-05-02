const dep = new Tracker.Dependency

const colStub = {
    find: () => {
    	dep.depend()

    	return {
	        fetch: () => [],
	        count: () => 0
    	}
	},
    findOne: () => {
    	dep.depend()

    	return undefined
    },
    change: () => dep.changed() // in order to retain reactivity, use this to notify helpers that the collection has been imported so they can rerun and use new data
}

export { colStub }

/*
const colStub = () => ({
	setSource: function(source) {
		this.source.set(source)
	},
    find: function() {
    	return this.source.find.apply(null, Array.from(arguments))
    },
    findOne: function() {
    	return this.source.findOne.apply(null, Array.from(arguments))
    },
    source: new ReactiveVar({
    	find: () => ({
    		fetch: () => [],
	        count: () => 0
	    }),
	    findOne: () => {}
    })
})

export { colStub }*/