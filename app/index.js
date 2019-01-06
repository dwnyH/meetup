// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';
import { debounce } from 'lodash';

let lat;
let lon;
let eventPositions = [];

var mapContainer = document.getElementById('map'); // 지도를 표시할 div
var mapOption = {
        center: new daum.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
        level: 9 // 지도의 확대 레벨
    };

var map = new daum.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// 마커가 표시될 위치입니다
var markerPosition = new daum.maps.LatLng(33.450701, 126.570667);

// 마커를 생성합니다
var marker = new daum.maps.Marker({
    position: markerPosition
});

var geocoder = new daum.maps.services.Geocoder();



// 마커가 지도 위에 표시되도록 설정합니다
marker.setMap(map);

daum.maps.event.addListener(map, 'click', function(mouseEvent) {
  debugger;

  var latlng = mouseEvent.latLng;
  marker.setPosition(latlng);

  lat = latlng.getLat();
  lon = latlng.getLng();
  console.log(lat, lon);
  debugger;

  // requestMeetup(result[0].y, result[0].x).then(console.log(data.events)
  //   , (err) => alert(err));

  requestMeetup(lat, lon).then(data => {
    debugger;
    console.log(data.data.events);
  }, (err) => alert(err));

});

function requestMeetup(lat, lon) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=20&sig_id=271258437&lon=${lon}&lat=${lat}&sig=c0b195f994d2d658b2987f09644e29d9c01e4a56`,
      dataType: 'jsonp',
      success: function(data) {
        debugger;
        resolve(data);
      },
      error: function(error) {
        debugger;
        reject(error);
      },
    });
  })
}

let searchInput = document.querySelector('.address');

let showSearchedSpot = _.debounce(
  function (event) {
    let inputKey = event.keyCode;
    if (inputKey === 13) {
      console.log(searchInput.value);
      geocoder.addressSearch(searchInput.value, abc);
    }
  }, 300);

searchInput.addEventListener('keydown', showSearchedSpot);

function abc(result, status) {

  // 정상적으로 검색이 완료됐으면
   if (status === daum.maps.services.Status.OK) {

      var coords = new daum.maps.LatLng(result[0].y, result[0].x);

      // 결과값으로 받은 위치를 마커로 표시합니다
      var marker = new daum.maps.Marker({
          map: map,
          position: coords
      });


      // 인포윈도우로 장소에 대한 설명을 표시합니다
      var infowindow = new daum.maps.InfoWindow({
          content: `<div style="width:150px;text-align:center;padding:6px 0;">${searchInput.value}</div>`
      });

      infowindow.open(map, marker);

      // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
      map.setCenter(coords);

      requestMeetup(result[0].y, result[0].x).then(showEvents
      , (err) => alert(err));
  }
}


function showEvents(data) {
  console.log(data.data.events);
  let events = data.data.events;

  for (let i = 0; i < events.length; i++) {
    let eventPosition = {};
    eventPosition.title = events[i].name;
    eventPosition.latlng = new daum.maps.LatLng(events[i].group.lat, events[i].group.lon);
    eventPositions.push(eventPosition);

    // if (events[i].venue) {
    //   console.log(events[i].venue)
    // }

    requestHostInfo(events[i].id, events[i].group.urlname).then(
      //data => console.log(data)
    );
  }

  markEventsOnMap(eventPositions);
}


function requestHostInfo(id, urlname) {

  return new Promise(function(resolve, reject) {
    $.ajax({
      url: `https://api.meetup.com/${urlname}/events/${id}/hosts?&sign=true&photo-host=public`,
      dataType: 'jsonp',
      success: function(data) {
        resolve(data);
      },
      error: function(error) {
        reject(error);
      },
    });
  })
}

function markEventsOnMap(eventPositions) {
  debugger;

  var eventMarkerImageSrc = "http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";

  for (var i = 0; i < eventPositions.length; i ++) {
      // 마커 이미지의 이미지 크기 입니다
      var eventMarkerImageSize = new daum.maps.Size(24, 35);
      // 마커 이미지를 생성합니다
      var eventMarkerImage = new daum.maps.MarkerImage(eventMarkerImageSrc, eventMarkerImageSize);
      // 마커를 생성합니다
      var eventMarker = new daum.maps.Marker({
          map: map, // 마커를 표시할 지도
          position: eventPositions[i].latlng, // 마커를 표시할 위치
          title : eventPositions[i].title, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
          image : eventMarkerImage // 마커 이미지
      });
  }
}



requestTopicInfo(18).then(
  data => console.log(data)
);

function requestTopicInfo(categoryId) {
debugger;
  return new Promise(function(resolve, reject) {
    $.ajax({
      //`https://api.meetup.com/find/groups?photo-host=public&zip=06676&page=20&country=%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD&sig_id=271258437&topic_id=${topicId}&sig=c75613b5c7c3b1bd426372613f60b484feacd436`
      url: `https://api.meetup.com/find/groups?photo-host=public&page=50&sig_id=271258437&category=+${categoryId}&sig=d2b48db9d5d1ba847e34aab51fd0d8406dae2b62&key=17214911107c1b1a3412d223c7a111e`,
      dataType: 'jsonp',
      success: function(data) {
        debugger;
        resolve(data);
      },
      error: function(error) {
        debugger;
        reject(error);
      },
    });
  })
}

