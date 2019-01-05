// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

let lat;
let lon;

var mapContainer = document.getElementById('map'); // 지도를 표시할 div
var mapOption = {
        center: new daum.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };

var map = new daum.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// 마커가 표시될 위치입니다
var markerPosition = new daum.maps.LatLng(33.450701, 126.570667);

// 마커를 생성합니다
var marker = new daum.maps.Marker({
    position: markerPosition
});

// 마커가 지도 위에 표시되도록 설정합니다
marker.setMap(map);

// 마커가 드래그 가능하도록 설정합니다
marker.setDraggable(true);

daum.maps.event.addListener(map, 'click', function(mouseEvent) {

  var latlng = mouseEvent.latLng;
  marker.setPosition(latlng);
  debugger;
  lat = latlng.getLat();
  lon = latlng.getLng();

  var message = '클릭한 위치의 위도는 ' + lat + ' 이고, ';
  message += '경도는 ' + lon + ' 입니다';
  debugger;
  console.log(message);

  requestMeetup(lat, lon).then(data => {
    console.log(data.data);
  }, (err) => alert(err));


});

function requestMeetup(lat, lon) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=20&sig_id=271258437&lon=${lon}&lat=${lat}&sig=c0b195f994d2d658b2987f09644e29d9c01e4a56`,
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



