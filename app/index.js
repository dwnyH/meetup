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
let hostInfos = [];

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

function resizeMap() {
  var mapContainer = document.getElementById('map');
  mapContainer.style.width = '100%';
  mapContainer.style.height = '300px';
  mapContainer.style.display = 'inline-block';
}

function relayout() {
  map.relayout();
}

resizeMap();
relayout();

// 마커가 지도 위에 표시되도록 설정합니다
marker.setMap(map);

daum.maps.event.addListener(map, 'click', function(mouseEvent) {
  //debugger;

  var latlng = mouseEvent.latLng;
  marker.setPosition(latlng);

  lat = latlng.getLat();
  lon = latlng.getLng();
  console.log(lat, lon);
  //debugger;
  requestMeetingInfos(lat, lon).then(requestAdditionalInfos);
});

function requestMeetingInfos(lat, lon) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=50&sig_id=271258437&fields=featured_photo&lon=${lon}&lat=${lat}&sig=81be475c66b00480489c434302f8880add213a8c`,
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

let searchInput = document.querySelector('.address');

let showSearchedSpot = _.debounce(
  function (event) {
    let inputKey = event.keyCode;
    if (inputKey === 13) {
      //console.log(searchInput.value);
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

      requestMeetingInfos(result[0].y, result[0].x).then(requestAdditionalInfos);
  }
}


function requestAdditionalInfos(data) {
  //console.log(data.data.events);
  let events = data.data.events;

  events.forEach(function(event) {
    //requestHostInfo(event.id, event.group.urlname)
    const hostInfo = requestHostInfo(event.id, event.group.urlname);

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
    });
  }
    hostInfos.push(hostInfo);
  })

  Promise.all(hostInfos).then(showMeetingEvents).catch(err => console.log(err));
  markEventsOnMap(eventPositions);

  function showMeetingEvents(data) {
    let hostInformations = data;
    let results = document.querySelector('.results');

    console.log('events :',events);
    console.log(hostInformations);

    for (let i = 0; i < events.length; i++) {

      let eventList = document.createElement('div');
      let eventName = document.createElement('div');
      let groupName = document.createElement('div');
      let eventDate = document.createElement('div');
      let rsvp = document.createElement('div');
      let hostName = document.createElement('div');
      let hostImg = document.createElement('img');
      let meetingImg = document.createElement('img');
      let imgWrapper = document.createElement('div');
      let contentWrapper = document.createElement('div');
      let hostWrapper = document.createElement('div');

      eventList.classList.add('event');
      eventName.classList.add('eventName');
      groupName.classList.add('groupName');
      eventDate.classList.add('eventDate');
      rsvp.classList.add('rsvp');
      hostName.classList.add('hostName');
      hostImg.classList.add('hostImg');
      meetingImg.classList.add('meetingImg');
      contentWrapper.classList.add('contentWrapper');
      hostWrapper.classList.add('hostWrapper');

      eventName.textContent = events[i].name;
      groupName.textContent = events[i].group.name;
      eventDate.textContent = `${events[i].local_date} | ${events[i].local_time}`;
      rsvp.textContent = `${events[i].yes_rsvp_count}명 참여신청`;
      hostName.textContent = hostInformations[i].data[0].name;
      hostImg.src = hostInformations[i].data[0].photo.photo_link;

      if(events[i].featured_photo) {
        meetingImg.src = events[i].featured_photo.photo_link;
      } else {
        meetingImg.src = "https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80";
      }

      imgWrapper.appendChild(meetingImg);
      imgWrapper.appendChild(rsvp);

      hostWrapper.appendChild(hostImg);
      hostWrapper.appendChild(hostName);
      contentWrapper.appendChild(eventName);
      // contentWrapper.appendChild(imgWrapper);
      contentWrapper.appendChild(groupName);
      contentWrapper.appendChild(eventDate);
      //eventList.appendChild(meetingImg);
      // eventList.appendChild(eventName);
      // eventList.appendChild(imgWrapper);
      // eventList.appendChild(groupName);
      // eventList.appendChild(eventDate);
      // eventList.appendChild(rsvp);
      eventList.appendChild(imgWrapper);
      eventList.appendChild(hostWrapper);
      eventList.appendChild(contentWrapper);
      results.appendChild(eventList);

    }
  }
}



// function requestHostInfo(id, urlname) {

//   return new Promise(function(resolve, reject) {
//     $.ajax({
//       url: `https://api.meetup.com/${urlname}/events/${id}/hosts?&sign=true&photo-host=public`,
//       dataType: 'jsonp',
//       success: function(data) {
//         resolve(data);
//       },
//       error: function(error) {
//         reject(error);
//       },
//     });
//   })
// }

function markEventsOnMap(eventPositions) {
  //debugger;

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
  //data => console.log(data)
);

function requestTopicInfo(categoryId) {
//debugger;
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: `https://api.meetup.com/find/groups?photo-host=public&page=50&sig_id=271258437&category=+${categoryId}&fields=featured_photo&sig=d2b48db9d5d1ba847e34aab51fd0d8406dae2b62&key=17214911107c1b1a3412d223c7a111e`,
      dataType: 'jsonp',
      success: function(data) {
        //debugger;
        resolve(data);
      },
      error: function(error) {
        //debugger;
        reject(error);
      },
    });
  })
}

