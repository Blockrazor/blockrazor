import typeahead from 'corejs-typeahead' //maintained typeahead
import './typeahead.html'
import './typeahead.css'

import {
	Template
} from 'meteor/templating';
import {
	Features,
} from '/imports/api/indexDB.js'

/*
{
  @@summary
    Has transcient option that will use subscription for fast render, but will begin using static data from method ASAP
      to stop jogging publication and DB every time a user types a letter.

      Example usage:
        in parent helper:
          params: (){
            return {
              template: Template.instance(),
              query: function(templ){return {_id: 1}}),
              projection: function(templ){return {sort: {_id: 1}}})
            }
          }
        in spacebars:
          {{> typeahead params}}

      Real examples:
          compareCurrencies.js, currencyAuction.js

  @@props //shows default values for booleans
    transcient: true, //if typeahead should begin querying locally from LocalizableCollection 
    col: obj, //collection to use
    template: Template.instance(), //parent template instance
    query: (templ, entry)=>{return {...}}, //templ is parent template instance, text in typeahead field
    projection: (templ, entry)=>{return {...}}, //templ is parent template instance, text in typeahead field
    limit: number,
    focus: false, //typeahead renders focused
    autoFocus: false, //typeahead will maintain focus after selection
    quickEnter: true, //On "enter" keypress typeahead will add the first value in list
    add: function(event, doc, templ){...}, //templ is parent template instance, doc is document added
    displayField: name, //field that appears in typeahead select menu
}
*/

Template.typeahead.onCreated(function () {
  console.log(this.data, "props")
  
  //init default values if not specified
  this.data.transcient = this.data.transcient == undefined? true: this.data.transcient
  this.data.focus = this.data.focus === undefined? false: this.data.focus
  this.data.autoFocus = this.data.autoFocus === undefined? false: this.data.autoFocus
  this.data.quickEnter = this.data.quickEnter === undefined? true: this.data.quickEnter

  var props = this.data
  var templ = props.template

  //query to run
  if (this.data.transcient) {
    this.search = (entry) => this.data.col.findLocal(props.query(templ, entry), Object.assign(props.projection(templ, entry), {limit: props.limit})).fetch()
  } else {
    this.search = (entry) => this.data.col.find(props.query(templ, entry), Object.assign(props.projection(templ, entry), {limit: props.limit})).fetch()
  }
  //initialize typeahead, is used onRendered
	this.init = () => {
    var props = this.data
    var templ = props.template
    var {localCol, col} = props

		var option1 = {
			hint: true,
			highlight: true,
			minLength: 0,
		}
		var option2 = {
			// name: 'states',
			display: (x) => x[props.displayField],
			limit: props.limit,
			source: currySearch(templ, this)
		}
	
		//binding for usage in onRednered hook
		this.option1 = option1
    this.option2 = option2

    //provides selection menu for typeahead
    //@params parent templante instance, and this template instance
		function currySearch(templ, typeahead) {
			return function typeAheadSearch(entry, CB) {
          CB(
            typeahead.search(entry)
          )
			}
    }

		function curryEvent (template) {
      return function(event, value){
        // typeahead renitiliazed reactively
        props.add(event, value, template)
      }
		}
    // this.curryEvent = curryEvent
    
    $('.typeahead').typeahead(option1, option2)

    //adds first found entry in autocomplete on enter keypress
    if (props.quickEnter){
      $('.typeahead').on('keyup', {
        templ: props.template,
        typeahead: Template.instance()
      }, function (event) {
        if (event.keyCode == 13) {
          var a = event.data.typeahead.search(event.target.value)
          if (a) {
            curryEvent(event.data.templ, event.data.typeahead)(null, a)
          }
        }
      });
    }

		$('.typeahead').focus()

		$('.typeahead').bind('typeahead:select', curryEvent(templ, this))

		$('.typeahead').bind('typeahead:autocomplete', curryEvent(templ, this))
  }
})

Template.typeahead.onRendered(function () {
  //reinitialize typeahead once static data is ready, and typeahead rendered
	this.autorun((comp) => {
		if (this.data.col.readyLocal()) {
      $('.typeahead').typeahead('destroy')
			this.init()
			comp.stop()
		}
  })
  
  //initialize typeahead
  this.init()
  this.autorun(()=>{
    // this destroy/init dance is required since you can't open menu without refocusing after select
    // and the below
    // used to keep typeahead data source reactive, running currySearch callback- CB- within autorun will not update selection menu
    this.search("")
    if (document.activeElement === document.getElementById('some')){
      $('.typeahead').typeahead('destroy')
      $('.typeahead').blur()
      $('.typeahead').typeahead(this.option1, this.option2)
      $('.typeahead').typeahead('val', '');
      if (this.data.autoFocus, this.data){
        $('.typeahead').focus()
      }
    } else {
      $('.typeahead').typeahead('destroy')
      $('.typeahead').typeahead(this.option1, this.option2)
    }
  })
})

Template.typeahead.onDestroyed(function () {
	$(".typeahead").typeahead("destroy")
	$(".typeahead").off("keyup")
})