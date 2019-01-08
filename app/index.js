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
let hostInfos = [];
let results;
let hostInformations;
let events;
const mapSearchButton = document.querySelector('.mapSearchButton');
const loadingPage = document.querySelector('.loadingPage');
const bookmarkList = document.querySelector('.bookmarkList');
const bookmarksinStorage = JSON.parse(localStorage.getItem('bookMark'));
const searchInput = document.querySelector('.address');
const bookmarkShowButton = document.querySelector('.bookmarkShowButton');
const bookmarkListWrapper = document.querySelector('.bookmarkListWrapper');
const mapContainer = document.getElementById('map');
const mapOption = {
  center: new daum.maps.LatLng(37.503461, 127.022127),
  level: 13
};
const map = new daum.maps.Map(mapContainer, mapOption);
const markerPosition = new daum.maps.LatLng(37.503461, 127.022127);
const marker = new daum.maps.Marker({
  position: markerPosition
});
const geocoder = new daum.maps.services.Geocoder();

const loadDaumMap = () => {
  resizeMap();
  relayout();
  marker.setMap(map);
};

const resizeMap = () => {
  const mapContainer = document.getElementById('map');

  mapContainer.style.width = '100%';
  mapContainer.style.height = '400px';
  mapContainer.style.display = 'inli-block';
};

const relayout = () => {
  map.relayout();
};

const showSearchingArea = () => {
  const searchingArea = document.querySelector('.search');

  searchingArea.style.display = 'flex';
  window.scrollTo({top: 600, behavior : 'smooth'});
  loadBookmarks();
};

daum.maps.event.addListener(map, 'click', (mouseEvent) => {

  const latlng = mouseEvent.latLng;

  marker.setPosition(latlng);

  lat = latlng.getLat();
  lon = latlng.getLng();

  loadingPage.style.display = 'flex';

  requestMeetingInfos(lat, lon).then(requestAdditionalInfos).catch((err) => {
    loadingPage.style.display = 'none';
    alert(err);
  });
});

const searchingWithInputValue = _.debounce((event) => {
  let inputKey = event.keyCode;

  if (inputKey === 13) {
    geocoder.addressSearch(searchInput.value, showSearchedSpot);
  }
}, 300);

const showSearchedSpot = (result, status) => {

  if (status === daum.maps.services.Status.OK) {

    const coords = new daum.maps.LatLng(result[0].y, result[0].x);
    const marker = new daum.maps.Marker({
      map: map,
      position: coords
    });
    const infowindow = new daum.maps.InfoWindow({
      content: `<div style="width:150px;text-align:center;padding:6px 0;">${searchInput.value}</div>`
    });

    loadingPage.style.display = 'flex';
    infowindow.open(map, marker);
    map.setCenter(coords);

    requestMeetingInfos(result[0].y, result[0].x).then(requestAdditionalInfos);
  }
};

const requestMeetingInfos = (lat, lon) => {

  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=50&sig_id=271258437&fields=featured_photo&lon=${lon}&lat=${lat}&sig=81be475c66b00480489c434302f8880add213a8c&key=17214911107c1b1a3412d223c7a111e`,
      dataType: 'jsonp',
      success: (data) => {
        resolve(data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const requestAdditionalInfos = (data) => {

  events = data.data.events;
  hostInfos = [];

  if (!events.length) {
    alert('찾으시는 장소 근처에 모임이 없습니다.');
    loadingPage.style.display = 'none';
    return;
  }

  events.forEach((event) => {
    const requestHostInfo = (id, urlname) => {
      return new Promise((resolve, reject) => {

        $.ajax({
          url: `https://api.meetup.com/${urlname}/events/${id}/hosts?&sign=true&photo-host=public`,
          dataType: 'jsonp',
          success: (data) => {
            resolve(data);
          },
          error: (error) => {
            reject(error);
          },
        });
      });
    };

    let hostInfo = requestHostInfo(event.id, event.group.urlname);
    hostInfos.push(hostInfo);
  });

  Promise.all(hostInfos).then(removeRemainingEvents).catch((err) => {
    loadingPage.style.display = 'none';
    alert(err);
  });
};

const removeRemainingEvents = (data) => {
  hostInformations = data;
  results = document.querySelector('.results');

  if (results.hasChildNodes()) {
    while (results.firstChild) {
      results.removeChild(results.firstChild);
    }
  }

  makeEventLists();
};

const makeEventLists = () => {
  let numberOfList = 10;

  if (events.length <= 10) {
    numberOfList = events.length;
  }

  for (let j = 0; j < numberOfList; j++) {

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
    let markIcon = '<i class="fas fa-bookmark"></i>';
    let eventLink = document.createElement('a');

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
    bookMarkWrapper.classList.add('markIcon');
    eventLink.classList.add('eventLink');

    eventName.textContent = events[j].name;
    groupName.textContent = events[j].group.name;
    eventDate.textContent = `${events[j].local_date} | ${events[j].local_time}`;
    rsvp.textContent = `${events[j].yes_rsvp_count}명 참여신청`;
    hostName.textContent = hostInformations[j].data[0].name;
    hostImg.src = hostInformations[j].data[0].photo.photo_link;
    bookMarkWrapper.innerHTML = markIcon;
    eventLink.textContent = 'Join Event';
    eventLink.href = events[j].link;

    if (events[j].featured_photo) {
      meetingImg.src = events[j].featured_photo.photo_link;
    } else {
      meetingImg.src = "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80";
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
    contentWrapper.appendChild(eventLink);
    eventList.appendChild(imgWrapper);
    eventList.appendChild(hostWrapper);
    eventList.appendChild(contentWrapper);
    results.appendChild(eventList);
    results.setAttribute('href', events[j].link);
  }

  loadingPage.style.display = 'none';
  window.scrollTo({top: 1500, behavior : 'smooth'});
};

const loadBookmarks = () => {
  if (bookmarksinStorage) {
    makeBookmark(0);
  }

  bookmarkListDragger();
};

const bookmarkListDragger = () => {
  let pressing = false;
  let startX;
  let scrollLeft;

  bookmarkList.addEventListener('mousedown', (event) => {
    pressing = true;
    bookmarkList.classList.add('active');
    startX = event.pageX - bookmarkList.offsetLeft;
    scrollLeft = bookmarkList.scrollLeft;
  });

  bookmarkList.addEventListener('mouseleave', () => {
    pressing = false;
    bookmarkList.classList.remove('active');
  });

  bookmarkList.addEventListener('mouseup', () => {
    pressing = false;
    bookmarkList.classList.remove('active');
  });

  bookmarkList.addEventListener('mousemove', (event) => {
    let x = event.pageX - bookmarkList.offsetLeft;
    let moving = (x - startX) * 3;

    if (!pressing) {
      return;
    }

    event.preventDefault();
    bookmarkList.scrollLeft = scrollLeft - moving;
  });
};

const addInBookmark = (event) => {

  const selectedArea = event.currentTarget.parentNode.parentNode;
  const selectedEventName = selectedArea.children[2].children[0].innerText;
  const selectedEventImg = selectedArea.children[0].children[0].getAttribute('src');
  const selectedEventUrl = selectedArea.children[2].children[3].getAttribute('href');
  const bookMark = {'eventName' : selectedEventName, 'eventImg' : selectedEventImg, 'eventUrl' : selectedEventUrl};
  let bookMarks = JSON.parse(localStorage.getItem('bookMark'));
  let bookMarkLength;
  let saved = false;

  event.currentTarget.classList.toggle('marked');

  if (!bookMarks) {
    bookMarks = [];
  } else {
    bookMarkLength = bookMarks.length;
  }

  for (let i = 0; i < bookMarks.length; i++) {
    if (bookMarks[i].eventUrl === selectedEventUrl) {
      alert('저장된 이벤트입니다 :)');
      saved = true;
      event.currentTarget.classList.add('marked');
    }
  }

  if (!saved) {
    bookMarks.push(bookMark);
    localStorage.setItem("bookMark", JSON.stringify(bookMarks));
    makeBookmark(bookMarkLength);
  }
};

const makeBookmark = (selectedbookMark) => {
  const bookmarkStorage = document.querySelector('.bookmarkList');
  let chosenEvents = JSON.parse(localStorage.getItem('bookMark'));
  let newBookmarkIndex;

  if (selectedbookMark) {
    newBookmarkIndex = selectedbookMark;
  } else {
    newBookmarkIndex = 0;
  }

  for (let i = newBookmarkIndex; i < chosenEvents.length; i++) {
    let chosenEvent = document.createElement('div');
    let chosenEventImg = document.createElement('img');
    let chosenEventTitle = document.createElement('div');
    let chosenEventUrl = document.createElement('a');
    let deleteIcon = document.createElement('div');

    chosenEvent.classList.add('chosenEvent');
    chosenEventImg.classList.add('chosenEventImg');
    chosenEventImg.src = chosenEvents[i].eventImg;
    chosenEventTitle.classList.add('chosenEventTitle');
    chosenEventTitle.textContent = chosenEvents[i].eventName;
    chosenEventUrl.textContent = 'Join Event';
    chosenEventUrl.href = chosenEvents[i].eventUrl;
    chosenEventUrl.classList.add('chosenEventUrl');
    deleteIcon.classList.add('deleteIcon');
    deleteIcon.textContent = 'x';

    chosenEvent.appendChild(deleteIcon);
    chosenEvent.appendChild(chosenEventImg);
    chosenEvent.appendChild(chosenEventTitle);
    chosenEvent.appendChild(chosenEventUrl);
    bookmarkStorage.appendChild(chosenEvent);

    deleteIcon.addEventListener('click', deleteMarkedEvent);
  }
};

const deleteMarkedEvent = (event) => {
  let chosenBookmarkEvent = event.target.parentNode.children[2].innerText;
  let allBookmarks = JSON.parse(localStorage.getItem('bookMark'));

  for (let i = 0; i < allBookmarks.length; i++) {
    if (allBookmarks[i].eventName == chosenBookmarkEvent) {
      allBookmarks.splice(i, 1);
    }
  }

  event.target.parentNode.remove();
  localStorage.setItem('bookMark', JSON.stringify(allBookmarks));
};

const controlBookmarkVisibility = (event) => {
  bookmarkListWrapper.classList.toggle('visible');

  if (bookmarkListWrapper.classList.contains('visible')) {
    event.target.innerHTML = '∧';
  } else {
    event.target.innerHTML = '∨';
  }
};

loadDaumMap();
mapSearchButton.addEventListener('click', showSearchingArea);
searchInput.addEventListener('keydown', searchingWithInputValue);
bookmarkShowButton.addEventListener('click', controlBookmarkVisibility);
