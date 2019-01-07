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
let bookMarks = [];

const bookmarksinStorage = JSON.parse(localStorage.getItem('bookMark'));

if (bookmarksinStorage.length) {
  showBookmarks(0);
}

var mapContainer = document.getElementById('map');
var mapOption = {
    center: new daum.maps.LatLng(33.450701, 126.570667),
    level: 9 // 지도의 확대 레벨
};

var map = new daum.maps.Map(mapContainer, mapOption);
var markerPosition = new daum.maps.LatLng(33.450701, 126.570667);

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
marker.setMap(map);

daum.maps.event.addListener(map, 'click', function(mouseEvent) {
  //debugger;

  var latlng = mouseEvent.latLng;
  marker.setPosition(latlng);

  lat = latlng.getLat();
  lon = latlng.getLng();
  console.log(lat, lon);
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
      geocoder.addressSearch(searchInput.value, viewMap);
    }
  }, 300);

searchInput.addEventListener('keydown', showSearchedSpot);

function viewMap(result, status) {

   if (status === daum.maps.services.Status.OK) {

      var coords = new daum.maps.LatLng(result[0].y, result[0].x);
      var marker = new daum.maps.Marker({
          map: map,
          position: coords
      });

      var infowindow = new daum.maps.InfoWindow({
          content: `<div style="width:150px;text-align:center;padding:6px 0;">${searchInput.value}</div>`
      });

      infowindow.open(map, marker);
      map.setCenter(coords);

      requestMeetingInfos(result[0].y, result[0].x).then(requestAdditionalInfos);
  }
}


function requestAdditionalInfos(data) {
  let events = data.data.events;
  hostInfos = [];

  events.forEach(function(event) {
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
    debugger;
    if (results.hasChildNodes()) {
      while (results.firstChild) {
        results.removeChild(results.firstChild);
      }
    }

    console.log('events :',events);
    console.log(hostInformations);

    for (let j = 0; j < 10; j++) {

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
      let bookMarkWrapper = document.createElement('span');
      let bulbIcon = '<i class="far fa-lightbulb"></i>';

      eventList.classList.add('event');
      eventName.classList.add('eventName');
      groupName.classList.add('groupName');
      eventDate.classList.add('eventDate');
      rsvp.classList.add('rsvp');
      hostName.classList.add('hostName');
      hostImg.classList.add('hostImg');
      meetingImg.classList.add('meetingImg');
      imgWrapper.classList.add('imgWrapper');
      contentWrapper.classList.add('contentWrapper');
      hostWrapper.classList.add('hostWrapper');
      bookMarkWrapper.classList.add('bulbIcon');

      eventName.textContent = events[j].name;
      groupName.textContent = events[j].group.name;
      eventDate.textContent = `${events[j].local_date} | ${events[j].local_time}`;
      rsvp.textContent = `${events[j].yes_rsvp_count}명 참여신청`;
      hostName.textContent = hostInformations[j].data[0].name;
      hostImg.src = hostInformations[j].data[0].photo.photo_link;
      bookMarkWrapper.innerHTML = bulbIcon;

      if(events[j].featured_photo) {
        meetingImg.src = events[j].featured_photo.photo_link;
      } else {
        meetingImg.src = "https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80";
      }

      bookMarkWrapper.addEventListener('click', addInBookmark);

      imgWrapper.appendChild(meetingImg);
      imgWrapper.appendChild(bookMarkWrapper);
      imgWrapper.appendChild(rsvp);
      hostWrapper.appendChild(hostImg);
      hostWrapper.appendChild(hostName);
      contentWrapper.appendChild(eventName);
      contentWrapper.appendChild(groupName);
      contentWrapper.appendChild(eventDate);
      eventList.appendChild(imgWrapper);
      eventList.appendChild(hostWrapper);
      eventList.appendChild(contentWrapper);
      results.appendChild(eventList);
    }
  }
}

function addInBookmark(event) {
  debugger;
  console.log(event.currentTarget);
  const selectedArea = event.currentTarget.parentNode.parentNode;
  const selectedEventName = selectedArea.children[2].children[1].innerText;
  const selectedEventImg = selectedArea.children[0].children[0].getAttribute('src');
  debugger;
  let bookMark = {'eventName' : selectedEventName, 'eventImg' : selectedEventImg};
  let bookMarks = JSON.parse(localStorage.getItem('bookMark'));
  let bookMarkLength;

  if (!bookMarks) {
    bookMarks = [];
  } else {
    bookMarkLength = bookMarks.length;
  }
  bookMarks.push(bookMark);
  localStorage.setItem("bookMark", JSON.stringify(bookMarks));
  showBookmarks(bookMarkLength);
  // console.log(localStorage.getItem('bookMark'));
}

function showBookmarks(selectedbookMark) {
  const bookmarkStorage = document.querySelector('.bookmarkList')
  const chosenEvents = JSON.parse(localStorage.getItem('bookMark'));
  let newBookmarkIndex;

  if (selectedbookMark) {
    newBookmarkIndex = selectedbookMark;
  } else {
    newBookmarkIndex = 0;
  }

  for (let i = newBookmarkIndex; i < chosenEvents.length; i++) {
    const chosenEvent = document.createElement('div');
    const chosenEventImg = document.createElement('img');

    chosenEvent.classList.add('chosenEvent');
    chosenEventImg.classList.add('chosenEventImg');
    chosenEventImg.src = chosenEvents[i].eventImg;

    chosenEvent.appendChild(chosenEventImg);
    bookmarkStorage.appendChild(chosenEvent);
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

