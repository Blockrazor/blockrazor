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
              noneFound: function(templ, entry){
                function add (){
                  Meteor.call("addExchange", entry)
                }
                return `<span onclick=${add}>add exchange ${entry}</span>`
              },
              query: function(templ, entry){return {_id: 1}}),
              projection: function(templ, entry){return {sort: {_id: 1}}})

            }
          }
        in spacebars:
          {{> typeahead params}}

      Real examples:
          compareCurrencies.js, currencyAuction.js

  @@props //shows default values for booleans
    id: string, defaults to random number, id for typeahead field, upon typeahead initialization ".typeahead" isn't safe to use,
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
    displayField: name, //document field that appears in typeahead select menu
    placeholder: name, //placeholder for typeahead
    noneFound: function(templ, entry){...; return `ele`} //renders returned template literal if no results found
}
*/

Template.typeahead.onCreated(function () {
  console.log(this.data, "props")
  
  //init default values if not specified
  this.data.id = this.data.id == undefined? Random.id()+"": this.data.id+""
  this.data.transcient = this.data.transcient == undefined? true: this.data.transcient
  this.data.focus = this.data.focus === undefined? false: this.data.focus
  this.data.autoFocus = this.data.autoFocus === undefined? false: this.data.autoFocus
  this.data.quickEnter = this.data.quickEnter === undefined? true: this.data.quickEnter
  this.data.noneFound = this.data.noneFound === undefined? false: this.data.noneFound

  var props = this.data
  var templ = props.template
  this.ele = "#"+props.id
  

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

    function createElement(markup) {
      const temp = document.createElement('div')
      temp.innerHTML = markup
      const frag = document.createDocumentFragment()
      // Use childNodes to allow creating element nodes or text nodes:
      const children = Array.prototype.slice.apply(temp.childNodes)
      children.map(el => frag.appendChild(el))
      return frag
    }
    console.log(createElement(this.data.noneFound()))

		var option1 = {
			hint: true,
			highlight: true,
			minLength: 0,
		}
		var option2 = {
			// name: 'states',
			display: (x) => x[props.displayField],
			limit: props.limit,
      source: currySearch(templ, this),
      templates: {
        empty: this.data.noneFound(templ, this.data.id),
      }
		}
	
		//binding for usage in onRednered hook
		this.option1 = option1
    this.option2 = option2

    //provides selection menu for typeahead
    //@params parent templante instance, and this template instance
		function currySearch(templ, typeahead) {
      return function (entry, CB){
        var res = typeahead.search(entry)
          CB(res)
      }
    }

		function curryEvent (template) {
      return function(event, value){
        // typeahead renitiliazed reactively
        props.add(event, value, template)
      }
		}
    
    $(this.ele).typeahead(option1, option2)

    //adds first found entry in autocomplete on enter keypress
    if (props.quickEnter){
      $(this.ele).on('keyup', {
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

    if (this.data.focus){
      $(this.ele).focus()
    }
		$(this.ele).bind('typeahead:select', curryEvent(templ, this))
		$(this.ele).bind('typeahead:autocomplete', curryEvent(templ, this))
  }
})

Template.typeahead.onRendered(function () {
  //reinitialize typeahead once static data is ready, and typeahead rendered
	this.autorun((comp) => {
		if (this.data.transcient && this.data.col.readyLocal()) {
      $(this.ele).typeahead('destroy')
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
    if (document.activeElement === document.getElementById(this.data.id)){
      $(this.ele).typeahead('destroy')
      $(this.ele).blur()
      $(this.ele).typeahead(this.option1, this.option2)
      $(this.ele).typeahead('val', '');
      if (this.data.autoFocus, this.data){
        $(this.ele).focus()
      }
    } else {
      $(this.ele).typeahead('destroy')
      $(this.ele).typeahead(this.option1, this.option2)
    }
  })
})

Template.typeahead.onDestroyed(function () {
	$(".typeahead").typeahead("destroy")
	$(".typeahead").off("keyup")
})

Template.typeahead.helpers({
  id: ()=>{
    return Template.instance().data.id
  },
  placeholder: ()=>{
    return Template.instance().data.placeholder
  }
})