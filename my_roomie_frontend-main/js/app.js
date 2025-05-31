document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault(); 

  const user = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
    name: document.getElementById('name').value
  };

  fetch('http://localhost:8080/register', {  
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(err));
      }
      return res.json();
    })
    .then(data => {
      alert(`회원가입 성공! 환영합니다 ${data.name}님`);
    })
    .catch(err => {
      alert(err.message || '회원가입 실패 😢');
    });
});
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const user = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
  };

  fetch('http://localhost:8080/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
    credentials: 'include' // 서버에서 세션 유지 시 필수!
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(err));
      }
      return res.json();
    })
    .then(data => {
      alert(`${data.name}님 환영합니다!`);
      window.location.href = 'profile.html'; // 성공 시 이동할 페이지
    })
    .catch(err => {
      if (err.code === 'USER_NOT_FOUND') {
        alert('존재하지 않는 아이디입니다');
      } else if (err.code === 'INVALID_PASSWORD') {
        alert('비밀번호가 틀렸습니다');
      } else {
        alert('로그인 실패 😢');
      }
    });
});
// 내 정보 불러오기
function loadProfile() {
  fetch('http://localhost:8080/me', {
    method: 'GET',
    credentials: 'include'  // 세션 쿠키 포함
  })
    .then(res => {
      if (res.status === 401) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;
      document.getElementById('username').textContent = data.username;
      document.getElementById('name').textContent = data.name;
    })
    .catch(err => {
      alert('프로필 불러오기 실패');
      console.error(err);
    });
}

// 로그아웃
function logout() {
  fetch('http://localhost:8080/logout', {
    method: 'POST',
    credentials: 'include'
  })
    .then(() => {
      alert('로그아웃 되었습니다.');
      window.location.href = 'login.html';
    })
     .catch(err => {
      console.error('로그아웃 실패', err);
      alert('로그아웃 중 오류 발생');
    });
}

// 페이지가 열리면 자동으로 내 정보 불러오기
if (window.location.pathname.endsWith('profile.html')) {
  loadProfile();
}
// 설문 제출 기능
document.getElementById('surveyForm')?.addEventListener('submit', function (e) {
  e.preventDefault();

  const survey = {
    dormName: document.getElementById('dormName').value,
    cleanLevel: document.getElementById('cleanLevel').value,
    smoking: document.getElementById('smoking').value === 'true',
    etc: document.getElementById('etc').value
  };

  fetch('http://localhost:8080/surveys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(survey)
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => Promise.reject(err));
      return res.json();
    })
    .then(data => {
      alert('설문이 성공적으로 제출되었습니다!');
      console.log('서버로부터 받은 응답:', data);
      // window.location.href = 'surveyList.html'; // 필요 시 목록으로 이동
    })
    .catch(err => {
      console.error(err);
      alert(err.message || '설문 제출 실패 😢');
    });
});
// 설문 목록 가져오기
function loadSurveyList() {
  fetch('http://localhost:8080/surveys', {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('서버 응답 오류');
      return res.json();
    })
    .then(data => {
      const list = document.getElementById('surveyList');
      list.innerHTML = ''; // 기존 내용 비우기

      data.forEach(survey => {
        const card = document.createElement('div');
        card.style.border = '1px solid #ddd';
        card.style.padding = '10px';
        card.style.marginBottom = '10px';
        card.style.borderRadius = '8px';
        card.style.background = '#f9f9f9';

        card.innerHTML = `
          <p><strong>기숙사:</strong> ${survey.dormName}</p>
          <p><strong>청결도:</strong> ${survey.cleanLevel}</p>
          <p><strong>흡연 여부:</strong> ${survey.smoking ? '흡연' : '비흡연'}</p>
          <p><strong>기타 정보:</strong> ${survey.etc}</p>
          <p><strong>작성자:</strong> ${survey.user.name} (${survey.user.username})</p>
          <p><strong>작성 시각:</strong> ${survey.createdAt}</p>
          ${survey.mine ? '<p style="color: green;"><strong>✔️ 내 설문</strong></p>' : ''}
        `;
        list.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      alert('설문 목록을 불러오지 못했습니다.');
    });
}

// 자동 실행: surveyList.html 이 열리면 실행되도록
if (window.location.pathname.endsWith('surveyList.html')) {
  loadSurveyList();
}
function loadMatching() {
  const id = document.getElementById('surveyId').value;
  if (!id) {
    alert('설문 ID를 입력해주세요!');
    return;
  }

  fetch(`http://localhost:8080/surveys/matching?id=${id}`, {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('매칭 결과를 불러오지 못했습니다.');
      return res.json();
    })
    .then(data => {
      const resultBox = document.getElementById('matchResults');
      resultBox.innerHTML = '';

      if (data.length === 0) {
        resultBox.innerHTML = '<p>일치하는 룸메이트가 없습니다.</p>';
        return;
      }

      data.forEach(match => {
        const card = document.createElement('div');
        card.style.border = '1px solid #ccc';
        card.style.padding = '10px';
        card.style.marginBottom = '10px';
        card.style.borderRadius = '6px';
        card.style.background = '#f0f8ff';

        card.innerHTML = `
          <p><strong>이름:</strong> ${match.user.name}</p>
          <p><strong>아이디:</strong> ${match.user.username}</p>
          <p><strong>기숙사:</strong> ${match.dormName}</p>
          <p><strong>청결도:</strong> ${match.cleanLevel}</p>
          <p><strong>흡연 여부:</strong> ${match.smoking ? '흡연' : '비흡연'}</p>
          <p><strong>기타:</strong> ${match.etc}</p>
          <p><strong>일치율:</strong> ${match.matchingRate.toFixed(1)}%</p>
        `;

        resultBox.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      alert(err.message || '에러 발생');
    });
}

// 페이지가 match.html일 때만 자동 실행 안 함 (사용자가 버튼 클릭 시 실행)
function loadMySurveys() {
  fetch('http://localhost:8080/surveys/mine', {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('내 설문 목록 불러오기 실패');
      return res.json();
    })
    .then(data => {
      const list = document.getElementById('mySurveyList');
      list.innerHTML = '';

      if (data.length === 0) {
        list.innerHTML = '<p>제출한 설문이 없습니다.</p>';
        return;
      }

      data.forEach(survey => {
        const card = document.createElement('div');
        card.style.border = '1px solid #ccc';
        card.style.padding = '10px';
        card.style.marginBottom = '10px';
        card.style.borderRadius = '6px';
        card.style.background = '#e7f9f1';

        card.innerHTML = `
          <p><strong>기숙사:</strong> ${survey.dormName}</p>
          <p><strong>청결도:</strong> ${survey.cleanLevel}</p>
          <p><strong>흡연 여부:</strong> ${survey.smoking ? '흡연' : '비흡연'}</p>
          <p><strong>기타 정보:</strong> ${survey.etc}</p>
          <p><strong>작성 시간:</strong> ${survey.createdAt}</p>
          <p><strong>설문 ID:</strong> ${survey.id}</p>
          <button onclick="deleteSurvey(${survey.id})" style="background:#e11d48; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">
          삭제
          </button>
        `;

        list.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      alert('내 설문 목록을 불러오지 못했습니다.');
    });
}

// 페이지 자동 실행: mySurveys.html 일 때만 실행
if (window.location.pathname.endsWith('mySurveys.html')) {
  loadMySurveys(<button onclick="location.href='editSurvey.html?id=${survey.id}'"
        style="background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">
  수정
</button>
);
}
function deleteSurvey(id) {
  const confirmDelete = confirm(`정말 이 설문(ID: ${id})을 삭제하시겠습니까?`);
  if (!confirmDelete) return;

  fetch(`http://localhost:8080/surveys/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('삭제 실패');
      alert('삭제가 완료되었습니다!');
      loadMySurveys(); // 다시 목록 새로고침
    })
    .catch(err => {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    });
}
// editSurvey.html 열리면 실행
if (window.location.pathname.endsWith('editSurvey.html')) {
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');

  if (!surveyId) {
    alert('설문 ID가 없습니다.');
    window.location.href = 'mySurveys.html';
  } else {
    // 기존 데이터 불러오기
    fetch(`http://localhost:8080/surveys/${surveyId}`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById('dormName').value = data.dormName;
        document.getElementById('cleanLevel').value = data.cleanLevel;
        document.getElementById('smoking').value = data.smoking.toString();
        document.getElementById('etc').value = data.etc;
      })
      .catch(err => {
        console.error(err);
        alert('설문 데이터를 불러오지 못했습니다.');
      });

    // 수정 폼 제출
    document.getElementById('editSurveyForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const updatedSurvey = {
        dormName: document.getElementById('dormName').value,
        cleanLevel: document.getElementById('cleanLevel').value,
        smoking: document.getElementById('smoking').value === 'true',
        etc: document.getElementById('etc').value
      };

      fetch(`http://localhost:8080/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedSurvey)
      })
        .then(res => {
          if (!res.ok) throw new Error('수정 실패');
          alert('수정 완료!');
          window.location.href = 'mySurveys.html';
        })
        .catch(err => {
          console.error(err);
          alert('수정 중 오류가 발생했습니다.');
        });
    });
  }
}
// 메뉴 삽입
function insertMenu() {
  fetch('menu.html')
    .then(res => res.text())
    .then(html => {
      const nav = document.createElement('div');
      nav.innerHTML = html;
      document.body.insertBefore(nav, document.body.firstChild);
    });
}

// 모든 페이지에서 메뉴 자동 삽입
insertMenu();
// 로그인 상태 체크 함수
function updateLoginArea() {
  fetch('http://localhost:8080/me', {
    method: 'GET',
    credentials: 'include'
  })
  .then(html => {
  const nav = document.createElement('div');
  nav.innerHTML = html;
  document.body.insertBefore(nav, document.body.firstChild);
  updateLoginArea(); // ← 메뉴 로딩 후 로그인 상태 업데이트 실행
  })
    .then(res => {
      const loginArea = document.getElementById('loginArea');
      if (res.status === 401) {
        // 로그인 안 된 상태
        loginArea.innerHTML = `<a href="login.html" style="color:white; margin-right:10px;">로그인</a>`;
      } else {
        // 로그인된 상태
        loginArea.innerHTML = `
          <button onclick="logout()" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
            로그아웃
          </button>
        `;
      }
    })
    
    .catch(err => {
      console.error('로그인 상태 체크 실패', err);
    });
}

function checkLogin(requiredPages) {
  if (requiredPages.some(page => window.location.pathname.endsWith(page))) {
    fetch('http://localhost:8080/me', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => {
        if (res.status === 401) {
          alert('로그인이 필요합니다.');
          window.location.href = 'login.html';
        }
      })
      .catch(err => {
        console.error('로그인 상태 확인 실패', err);
        alert('로그인 확인 중 오류 발생');
        window.location.href = 'login.html';
      });
  }
}
// 접근 제한 걸 페이지들
const protectedPages = [
  'profile.html',
  'survey.html',
  'mySurveys.html',
  'match.html'
];

checkLogin(protectedPages);
// 공통 헤더 삽입
function insertHeader() {
  fetch('header.html')
    .then(res => res.text())
    .then(html => {
      const headerContainer = document.createElement('div');
      headerContainer.innerHTML = html;
      document.body.insertBefore(headerContainer, document.body.firstChild);
    });
}

insertHeader();

