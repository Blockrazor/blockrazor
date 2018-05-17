import typeahead from 'corejs-typeahead' //maintained typeahead
import './typeahead.html'
import './typeahead.css'

//framework for creating web components with bells and whistles, or without them (nx-framework)
import './typeNX.js'

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
              noneFound: function(){
                return `<span}>add exchange</span>`
              },
              query: function(templ, entry){return {_id: 1}}),
              projection: function(templ, entry){return {sort: {_id: 1}}})
              noneFound: function(){return `<span class="beautiful"> @{value} not found, create and add exchange to @{parent.currency.name}} //requires eventListener true, adds event listner if create prop exists
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
    create: function(event, inputValue, templ, cb){...}, //templ is parent template instance, doc is document added. triggers on click of noneFound element if exists.
    displayField: name, //document field that appears in typeahead select menu
    placeholder: name, //placeholder for typeahead
    noneFound: `ele` // renders returned template literal if no results found in another framework, example above, has state: {value: input value, parent: parent template instance, typeahead: typeahead template instance}
    value: reactiveVar- passes current input value to it, doesn't support passing down values to
    results: reactiveVar- passes current results to it
    customAddButtonExists: true, will render it's own add button on false, exclusive to inline 'button'-within menu- with existence of create prop (create=true, customAddButtonExists either triggers inline or integrated buttons),
}
*/

Template.typeahead.onCreated(function () {

  //init default values if not specified
  //makes id compatible html tag for use in empty template component
  this.id = this.data.id || Random.id().toLowerCase().split("").filter(x => Number.isNaN(Number(x)) ? true : false).join("") + "-tag"
  this.data.transcient = this.data.transcient == undefined ? true : this.data.transcient
  this.data.focus = this.data.focus === undefined ? false : this.data.focus
  this.data.autoFocus = this.data.autoFocus === undefined ? false : this.data.autoFocus
  this.data.quickEnter = this.data.quickEnter === undefined ? true : this.data.quickEnter
  if (true) { //is just true so that this code could collapsed in editor, is about noneFound template
    if (this.data.noneFound){
        this.noneFound = () => "<" + this.id + "> <span #click='clicked()'>" + this.data.noneFound + "</span></" + this.id + ">"
    } else if (this.data.create && this.data.customAddButtonExists) {
        this.noneFound = () => "<" + this.id + "> <span #click='clicked()'>" + "@{value} not found, create and add it" + "</span></" + this.id + ">"
    } else {
        this.noneFound = () => "<" + this.id + "> <span #click='clicked()'>" + "@{value} not found" + "</span></" + this.id + ">"
    }
    //create web component with nx-framework for nothing found template rendering
    //produces "module is not defined" error for no good reason while working
    var self = this
    var passTemplates = function (ele, state) {
      state.typeahead = self
      state.parent = self.data.template
      var autorun = Tracker.autorun(() => {
        state.value = state.typeahead.value.get()
      })
      ele.$cleanup(() => autorun.stop())
    }
    nx.component({
        root: true,
      }) //s.app({root: true})
      .useOnContent(nx.middlewares.observe)
      .useOnContent(nx.middlewares.interpolate)
      .useOnContent(nx.middlewares.attributes)
      .useOnContent(nx.middlewares.events)
      .use(passTemplates)
      .use((ele, state) => {
        if (state.clicked) {
          return
        } else {
            if (!state.typeahead.data.create || !state.typeahead.data.customAddButtonExists){ //stop binding event on rerun or if externa button is rendered
                state.clicked = ()=>{}
            } else {
            state.clicked = function (eve) {
            state.typeahead.data.create(eve, state.value, state.typeahead.data.template)
            }
          }
        }
      })
      .register(this.id)
  }

  this.results = new ReactiveVar([])
  this.value = new ReactiveVar("")

  var props = this.data
  var templ = props.template
  this.ele = "#" + this.id

  //query to run
  if (this.data.transcient) {
    this.search = (entry) => this.data.col.findLocal(props.query(templ, entry), Object.assign(props.projection(templ, entry), {
      limit: props.limit
    })).fetch()
  } else {
    this.search = (entry) => this.data.col.find(props.query(templ, entry), Object.assign(props.projection(templ, entry), {
      limit: props.limit
    })).fetch()
  }

  //passes on typeahead value/results to parent if they exist
  var value = this.data.value
  var results = this.data.results
  this.autorun(() => {
    if (value) {
      value.set(this.value.get())
    }
  })
  this.autorun(() => {
    if (results) {
      results.set(this.results.get())
    }
  })

  // this destroy/init dance is required since you can't open menu without refocusing after select
  // and the below
  // used to keep typeahead data source reactive or after events that change source, running currySearch callback- CB- within autorun will not update selection menu
  // reset = false for use inside tracker, true for events
  this.updateSource = function (reset = false, autoFocus = this.data.autoFocus) {
    if (document.activeElement === document.getElementById(this.id)) {
      $(this.ele).typeahead('destroy')
      $(this.ele).typeahead(this.option1, this.option2)
      if (reset && autoFocus) $(this.ele).typeahead('val', '');
      if (!reset || (autoFocus && reset)) { //if this isn't event then keep focused, otherwise refocus if autoFocus
        $(this.ele).focus();
      }
    } else {
      $(this.ele).typeahead('destroy')
      $(this.ele).typeahead(this.option1, this.option2)
    }
  }

  //initialize typeahead, is used onRendered
  this.init = () => {
    var props = this.data
    var templ = props.template
    var {
      localCol,
      col
    } = props

    function returnCurrentValue(eleString) {
      return () => {
        return $(eleString).typeahead('val')
      }
    }

    var option1 = {
      hint: true,
      highlight: true,
      minLength: 0
    }
    var option2 = {
      // name: 'states',
      display: (x) => x[props.displayField],
      limit: props.limit,
      source: currySearch(templ, this),
      templates: {
        empty: this.noneFound()
      }
    }

    //binding for usage in onRednered hook
    this.option1 = option1
    this.option2 = option2

    //provides selection menu for typeahead
    //@params parent templante instance, and this template instance
    function currySearch(templ, typeahead) {
      return function (entry, CB) {
        var res = typeahead.search(entry)
        typeahead.results.set(res)
        CB(res)
      }
    }

    function curryEvent(template, typeahead) {
      return function (event, value) {
        // typeahead renitiliazed reactively
        props.add(event, value, template)
        typeahead.updateSource(true, typeahead.data.autoFocus)
      }
    }

    $(this.ele).typeahead(option1, option2)

    //adds first found entry in autocomplete on enter keypress
    if (props.quickEnter) {
      $(this.ele).off("keyup").on('keyup', {
        templ: props.template,
        typeahead: Template.instance()
      }, (event) => {
        if (event.keyCode == 13) {
          var a = event.data.typeahead.search(event.target.value)
          a = a.length ? a[0] : null
          if (a) {
            curryEvent(event.data.templ, event.data.typeahead)(event, a)
          }
        }
      });
    }

    if (this.data.focus) {
      $(this.ele).focus()
    }

    $(this.ele).unbind('typeahead:select').bind('typeahead:select', curryEvent(templ, this))
    $(this.ele).unbind('typeahead:autocomplete').bind('typeahead:autocomplete', curryEvent(templ, this))
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

  this.autorun(() => {
    //this search is meant to update typeahead menu source, and possible in reaction to reactiveVars outside control of typeahead
    var a = this.search(this.value.get())
    this.updateSource()
  })
})

Template.typeahead.onDestroyed(function () {
  $(".typeahead").typeahead("destroy")
  $(".typeahead").off("keyup")
})

Template.typeahead.helpers({
  id: () => {
    return Template.instance().id
  },
  placeholder: () => {
    return Template.instance().data.placeholder
  },
  addButtonText: () => {
    return Template.instance().data.addButtonText
  },
  customAddButtonExists: () => {
    //convert to true for if statement in spacebars, that is false for button existence should produce true in spacebars if block
    return Template.instance().data.customAddButtonExists == undefined ? false : !Template.instance().data.customAddButtonExists
  },
  activateCreateButton: () => {
    var templ = Template.instance()
    if (templ.results.get().length == 0 && templ.value.get().replace(/\s/g, "") != "") {
      return ""
    } else {
      return "disabled"
    }
  }
})

Template.typeahead.events({
  "keyup .tt-input": (event, templ) => {
    templ.value.set(event.currentTarget.value)
  },
  "change .tt-input": (event, templ) => {
    templ.value.set(event.currentTarget.value)
  },
  'click .createItem': function (event, templ) {
   templ.data.create(event, templ.value.get(), templ.data.template)
   templ.updateSource(true, templ.data.autoFocus)
  }
})
