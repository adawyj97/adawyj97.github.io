mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyYWh3eWo5NyIsImEiOiJjaXRqbDY4MGowODd2MnNudjZoYTRoYTdvIn0.IJkerWhlLG-vRoCpqtL8NA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [179.200993, -8.520496],
    zoom: 16,
    pitch: 50,
    bearing: -5.6,
    container: 'map',
    antialias: true
});

var trans_on = 0;
var food_on = 0;
var buildings_on = 0;
var trans_weight = 1;
var food_weight = 1;
var buildings_weight = 1;
var num_switch = 0;

var islandLoc = {
  'Nanumea':{
    'cor': [176.124937, -5.674855],
    'zoom': 13
  },
  'Niutao':{
    'cor': [177.342939, -6.108872],
    'zoom': 14
  },
  'Nanumaga':{
    'cor': [176.319494, -6.285822],
    'zoom': 13
  },
  'Nui':{
    'cor': [177.162076, -7.220970],
    'zoom': 13
  },
  'Vaitupu':{
    'cor': [178.678998, -7.477828],
    'zoom': 13
  },
  'Nukufetau':{
    'cor': [178.367552, -7.994038],
    'zoom': 11.5
  },
  'Funafuti':{
    'cor': [179.114308, -8.516122],
    'zoom': 11
  },
  'Nukulaelae':{
    'cor': [179.832588, -9.383703],
    'zoom': 12
  },
  'Niulakita':{
    'cor': [179.473064, -10.789087],
    'zoom': 15
  }
};

$(document).ready(function() {
  $("#slidervalue").text(`${$(".slider").val()} m`);
      map.on('load', function() {
        map.addSource('elevation', {
          type: 'vector',
          url: 'mapbox://sarahwyj97.b2ao8cok'
        });

        // Insert the layer beneath any symbol layer.
        var layers = map.getStyle().layers;
        var labelLayerId;
        for (var i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol') {
            labelLayerId = layers[i].id;
            break;
          }
        }

        map.addLayer(
        {
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
              ],
              'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          }, labelLayerId
          );


          map.addLayer({'id': 'fishnet',
            'type': 'fill',
            'source': 'elevation',
            'source-layer': 'DEM_grid_attri-4xfkep',
            'layout': {},
            'paint': {
              'fill-color': '#088',
              'fill-opacity': 0.9
            },
            'filter': ["==", `bel_${$("#myRange").val()}0_con`.slice(0, 10), 1]
          }, '3d-buildings');
        });

      document.getElementById("islands").onchange = function() {
        var selected = $("#islands option:selected").text();
        map.flyTo({
          center: islandLoc[selected].cor,
          zoom: islandLoc[selected].zoom,
          essential: true
        });
      };

      document.getElementById("myRange").onchange= function() {
        var elev = $("#myRange").val();
        var predicate = `bel_${elev}0_con`.slice(0, 10);
        $("#slidervalue").text(`${elev} m`);
        map.setFilter('fishnet', ["==", predicate, 1]);
      };

      var defineColor = function() {
        var maxNum = food_on * food_weight * 5 + trans_on * trans_weight * 5 + buildings_on * buildings_weight * 5;
        var interval1 = 0;
        var interval2 = 1/5 * maxNum;
        var interval3 = 2/5 * maxNum;
        var interval4 = 3/5 * maxNum;
        var interval5 = 4/5 * maxNum;
        var interval6 = maxNum;
        var colorList = [interval1, interval2, interval3, interval4, interval5, interval6];
        return colorList;
      };

      var updateLegend = function(colorList) {
        for (i=0; i<6; i++) {
          $('#impact-legend > div').eq(i)[0].lastChild.nodeValue = colorList[5-i];
        }
      };

      var impact = function() {
        var colorList = defineColor();
        updateLegend(colorList);
        map.setPaintProperty('fishnet', 'fill-color',  [
          'interpolate',
          ['linear'],
          ["+",["*", ['get', 'Food_recla'], food_on, food_weight] , ["*", ['get', 'Tran_recla'], trans_on, trans_weight], ["*", ['get', 'Buil_recla'], buildings_on, buildings_weight]],
          colorList[0],
          '#fff0ea',
          colorList[1],
          '#abd5dc',
          colorList[2],
          '#81b0cd',
          colorList[3],
          '#5e8abe',
          colorList[4],
          '#3c65ae',
          colorList[5],
          '#00429d'
        ]);
      };

      var controlweights = function() {
        if (trans_on == 1) {
          $(".slidecontainer.trans").show();
        }

        if (food_on == 1) {
            $(".slidecontainer.food").show();
        }

        if (buildings_on == 1) {
            $(".slidecontainer.buildings").show();
        }
      };

      var turnoffweights = function() {
        $(".slidecontainer.buildings").hide();
        $("#weight_build").val(1);
        buildings_weight = 1;
        $(".slidecontainer.food").hide();
        $("#weight_food").val(1);
        food_weight = 1;
        $(".slidecontainer.trans").hide();
        $("#weight_trans").val(1);
        trans_weight = 1;
        if (food_on + trans_on + buildings_on == 0) {
          map.setPaintProperty('fishnet', 'fill-color', '#088');
        } else {
          impact();
        }
      };

      $("#weight_food").on('change', function() {
        food_weight = Number($("#weight_food").val());
        impact();
      });

      $("#weight_trans").on('change', function() {
        trans_weight = Number($("#weight_trans").val());
        impact();
      });

      $("#weight_build").on('change', function() {
        buildings_weight = Number($("#weight_build").val());
        impact();
      });

      $("#food_switch").on('change', function(){
        if ($(this).is(':checked')) {
          $("#impact-legend").show();
          food_on = 1;
          num_switch += 1;
        } else {
          food_on = 0;
          num_switch -= 1;
          $(".slidecontainer.food").hide();
          $("#weight_food").val(1);
          food_weight = 1;
        }
        if (food_on + trans_on + buildings_on == 0) {
          $("#impact-legend").hide();
          map.setPaintProperty('fishnet', 'fill-color', '#088');
        } else {
          impact();
        }

        if (num_switch > 1) {
          controlweights();
        } else {
          turnoffweights();
        }
      });


      $("#transportation_switch").on('change', function() {
        if ($(this).is(':checked')) {
          $("#impact-legend").show();
          trans_on = 1;
          num_switch += 1;
        } else {
          trans_on = 0;
          num_switch -= 1;
          $(".slidecontainer.trans").hide();
          $("#weight_trans").val(1);
          trans_weight = 1;
        }
        if (food_on + trans_on + buildings_on == 0) {
          $("#impact-legend").hide();
          map.setPaintProperty('fishnet', 'fill-color', '#088');
        } else {
          impact();
        }
        if (num_switch > 1) {
          controlweights();
        } else {
          turnoffweights();
        }
      });

      $("#infrastructure_switch").on('change', function() {
        if ($(this).is(':checked')) {
          $("#impact-legend").show();
          buildings_on = 1;
          num_switch += 1;
        } else {
          buildings_on = 0;
          num_switch -= 1;
          $(".slidecontainer.buildings").hide();
          $("#weight_build").val(1);
          buildings_weight = 1;
        }
        if (food_on + trans_on + buildings_on == 0) {
          $("#impact-legend").hide();
          map.setPaintProperty('fishnet', 'fill-color', '#088');
        } else {
          impact();
        }
        if (num_switch > 1) {
          controlweights();
        } else {
          turnoffweights();
        }
      });

      map.on('click', 'fishnet', function(e) {
        new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`Elevation: ${e.features[0].properties.elevation} m <br> Total road length: ${e.features[0].properties.SUM_Highwa} m <br> Total number of buildings: ${e.features[0].properties.Buildings} <br> Total number of food-related amenities: ${e.features[0].properties.Grocery + e.features[0].properties.Food_amen}`)
        .addTo(map);
      });

      map.on('mouseenter', 'fishnet', function() {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'fishnet', function() {
        map.getCanvas().style.cursor = '';
      });
    });
