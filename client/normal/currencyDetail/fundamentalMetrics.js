import { Template } from 'meteor/templating';

Template.fundamentalMetrics.onRendered(function (){


  var radar = document.getElementById("radar").getContext('2d');
  radar.canvas.width = 800;
  radar.canvas.height = 600;
    var radarchart = new Chart(radar, {
        type: 'radar',
        data: {
          labels: ["Ongoing Development", "Code Quality", "Community", "Hash Power", "Settlement Speed", "Ease of Use", "Coin Distribution", "Transactions"],
          datasets: [
            {
              label: "1950",
              fill: true,
              backgroundColor: "rgba(255,120,50,0.2)",
              borderColor: "#FF6600",
              pointBorderColor: "#fff",
              pointStyle: "dot",
              pointBackgroundColor: "#FF0000",
              data: [6,7,2,2,7,8,1,3]
            },
            {
              label: "2",
              fill: false,
              backgroundColor: "#fff",
              borderColor: "#ccc",
              pointBorderColor: "#fff",
              borderWidth: 4,
              pointRadius: 0,
              pointBackgroundColor: "#fff",
              data: [10,10,10,10,10,10,10,10]
            },
            {
              label: "3",
              fill: false,
              backgroundColor: "#fff",
              borderColor: "#fff",
              borderWidth: 1,
              pointBorderColor: "#fff",
              pointBackgroundColor: "#fff",
              data: [0,0,0,0,0,0,0,0]
            }
          ]
        },
          options: {
            responsive: false,
            defaultFontColor: 'red',
          tooltips: {enabled: false},
          maintainAspectRatio: false,
          title: {display: false},
          legend: {
            display: false,
            position: 'bottom',
            labels: {
              fontColor: 'red',
              display: true,
            }
          },
          scale: {
            pointLabels: {fontSize: 14},

          // Hides the scale
          display: true
      }
        }
    });

});

Template.fundamentalMetrics.events({
  'click #name': function () {
    if(Session.get('lastId')){document.getElementById(Session.get('lastId')).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Session.set('lastId', this._id);


  }
});

Template.fundamentalMetrics.helpers({
  metricDescription: function () {
    return this.metricTag; //find metricTag data from collection
  },
  metrics: function() {
    var metrics = [{
      _id: "938274n5982735498",
      currencyName: "Bitcoin",
      name: "Ongoing Development",
      commitsYear: 1245,
      commits60day: 244,
      metricTag: "ongoingDevelopment"
    },
    {
      _id: "btyreybtrebret",
      name: "Code Quality",
      commitsYear: 1245,
      commits60day: 244
    },
    {
      _id: "635756745",
      name: "Coin Distribution",
      commitsYear: 1245,
      commits60day: 244
    },
    {
      _id: "73567567",
      name: "Community",
      commitsYear: 1245,
      commits60day: 244
    }];

    return metrics;
  }
});

Template.features.helpers({
  featureDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  features: function() {
    var features = [{
      _id: "3456435",
      currencyName: "Bitcoin",
      name: "Seggregated Witness",
      commitsYear: 1245,
      commits60day: 244,
      featureTag: "segwit"
    },
    {
      _id: "3456546",
      name: "Side Chains",
      featureTag: "sideChain"
    },
    {
      _id: "3456346",
      name: "Another Feature",
      commitsYear: 1245,
      commits60day: 244
    }];

    return features; // will later be a database call instead
    }
});

Template.discussion.helpers({
  totalComments: function () {
    return 123;
  },
  topComment: function() {
    return [{
      _id: "3456435",
      commentText: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies.",
      currencyId: "56735836736",
      authorName: "bitcoinfan",
      authorId: "985273948"
    }];

  },
  topReply: function() {
    return [{
      _id: "83958374",
      parentId: "3456435",
      commentText: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient.",
       authorName: "dashfan",
       authorId: "2345354"
    }]
  }
});

Template.features.events({
  'click #name': function () {
    if(Session.get('lastId')){document.getElementById(Session.get('lastId')).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Session.set('lastId', this._id);


  }
});


//
// Template.metricContent.onRendered(function (){
//   // Session.set('thisId', this.data._id);
//   // if (Session.get('lastId')) {
//   //   document.getElementById(Session.get('lastId')).style.display = "none";
//   // }
//   // document.getElementById(this.data._id).style.display = "block";
//   // Session.set('lastId', this.data._id);
// });
