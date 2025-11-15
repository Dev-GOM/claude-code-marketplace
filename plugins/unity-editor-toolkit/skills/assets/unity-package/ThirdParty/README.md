# Third-Party Dependencies

Unity Editor Toolkit에서 사용하는 외부 라이브러리 목록 및 설치 가이드입니다.

## 📦 현재 포함된 라이브러리

### 1. websocket-sharp
- **용도**: Unity Editor ↔ CLI WebSocket 통신
- **버전**: 포함됨
- **위치**: `ThirdParty/websocket-sharp/`

## 🆕 PostgreSQL DB 기능을 위해 추가 필요한 라이브러리

### 2. Npgsql (PostgreSQL .NET Driver)
- **용도**: Unity에서 PostgreSQL DB 연결
- **버전**: 6.x (권장: 6.0.11)
- **다운로드**: [NuGet Gallery - Npgsql](https://www.nuget.org/packages/Npgsql/)
- **설치 위치**: `ThirdParty/Npgsql/`

#### Npgsql 설치 단계:

**Option 1: NuGet Package Explorer 사용 (추천)**

1. NuGet Package Explorer 다운로드: https://github.com/NuGetPackageExplorer/NuGetPackageExplorer/releases
2. NuGet Package Explorer 실행
3. `File > Open Package from Online Feed...`
4. "Npgsql" 검색, 버전 6.0.11 선택
5. 오른쪽 패널에서 `lib/netstandard2.1/` 폴더 확인
6. 다음 DLL 파일들을 `ThirdParty/Npgsql/` 폴더에 복사:
   - `Npgsql.dll`
   - `System.Buffers.dll`
   - `System.Memory.dll`
   - `System.Runtime.CompilerServices.Unsafe.dll`
   - `System.Threading.Tasks.Extensions.dll`

**Option 2: NuGet CLI 사용**

```bash
# NuGet 설치
dotnet tool install --global NuGet.CommandLine

# Npgsql 다운로드
cd ThirdParty
mkdir Npgsql
cd Npgsql
nuget install Npgsql -Version 6.0.11 -Framework netstandard2.1

# DLL 파일 복사
cp Npgsql.6.0.11/lib/netstandard2.1/*.dll ./
cp System.Buffers.*/lib/netstandard2.1/*.dll ./
cp System.Memory.*/lib/netstandard2.1/*.dll ./
cp System.Runtime.CompilerServices.Unsafe.*/lib/netstandard2.1/*.dll ./
cp System.Threading.Tasks.Extensions.*/lib/netstandard2.1/*.dll ./

# 임시 폴더 삭제
rm -rf Npgsql.6.0.11/ System.Buffers.*/ System.Memory.*/ System.Runtime.CompilerServices.Unsafe.*/ System.Threading.Tasks.Extensions.*/
```

**Option 3: 수동 다운로드**

1. https://www.nuget.org/packages/Npgsql/6.0.11 접속
2. 오른쪽 "Download package" 클릭
3. `.nupkg` 파일을 `.zip`으로 이름 변경
4. 압축 해제
5. `lib/netstandard2.1/` 폴더의 DLL 파일들을 `ThirdParty/Npgsql/`에 복사

#### 최종 폴더 구조:

```
ThirdParty/
├── Npgsql/
│   ├── Npgsql.dll
│   ├── Npgsql.dll.meta (Unity가 자동 생성)
│   ├── System.Buffers.dll
│   ├── System.Buffers.dll.meta
│   ├── System.Memory.dll
│   ├── System.Memory.dll.meta
│   ├── System.Runtime.CompilerServices.Unsafe.dll
│   ├── System.Runtime.CompilerServices.Unsafe.dll.meta
│   ├── System.Threading.Tasks.Extensions.dll
│   └── System.Threading.Tasks.Extensions.dll.meta
└── websocket-sharp/
    └── (기존 파일들)
```

---

### 3. UniTask (Unity 비동기 프로그래밍)
- **용도**: 데이터베이스 비동기 작업 (DB 쿼리 시 Unity Main Thread 블로킹 방지)
- **버전**: 2.x (권장: 2.5.4)
- **다운로드**: [GitHub - UniTask](https://github.com/Cysharp/UniTask/releases)
- **설치 위치**: `ThirdParty/UniTask/`

#### UniTask 설치 단계:

**Option 1: Unity Package Manager (Git URL) - 추천**

1. Unity Editor 메뉴: `Window > Package Manager`
2. 왼쪽 상단 `+` 버튼 클릭
3. `Add package from git URL...` 선택
4. 입력: `https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask`
5. `Add` 클릭

**Option 2: .unitypackage 다운로드**

1. https://github.com/Cysharp/UniTask/releases 접속
2. 최신 릴리즈의 `UniTask.{version}.unitypackage` 다운로드
3. Unity Editor에서 `Assets > Import Package > Custom Package...`
4. 다운로드한 `.unitypackage` 선택
5. Import

**Option 3: 수동 DLL 추가 (고급)**

1. https://github.com/Cysharp/UniTask/releases 접속
2. Source code (zip) 다운로드
3. `src/UniTask/Assets/Plugins/UniTask/Runtime/` 폴더에서 `UniTask.dll` 복사
4. `ThirdParty/UniTask/` 폴더에 붙여넣기

#### 최종 폴더 구조 (Option 3 사용 시):

```
ThirdParty/
├── UniTask/
│   ├── UniTask.dll
│   └── UniTask.dll.meta
├── Npgsql/
│   └── (상기 DLL 파일들)
└── websocket-sharp/
    └── (기존 파일들)
```

---

## ✅ 설치 확인

1. Unity Editor 재시작
2. `Console` 탭에서 DLL 로딩 에러 확인
3. 메뉴: `Tools > Unity Editor Toolkit > Server Window`
4. Database 탭 확인 (Phase 1 완료 후 표시됨)

---

## 🔧 문제 해결

### DLL 충돌 에러

```
Assembly 'Npgsql' has already been loaded from a different location.
```

**해결:**
1. Unity 프로젝트의 `Packages/` 폴더에서 중복 Npgsql 제거
2. `Library/ScriptAssemblies/` 삭제
3. Unity Editor 재시작

### .NET Standard 2.1 호환성 에러

```
The type or namespace name 'System.Buffers' could not be found
```

**해결:**
1. Unity 2020.3 이상 사용 확인
2. `Edit > Project Settings > Player > Other Settings`
3. `Api Compatibility Level`: `.NET Standard 2.1` 선택
4. Unity Editor 재시작

### UniTask 중복 에러

```
Multiple precompiled assemblies with the same name UniTask.dll
```

**해결:**
- Option 1 (UPM) 사용 시 Option 3 (수동 DLL) 제거
- 또는 반대

---

## 📚 참고 문서

- [Npgsql Documentation](https://www.npgsql.org/doc/index.html)
- [UniTask Documentation](https://github.com/Cysharp/UniTask)
- [Unity .NET Profile Support](https://docs.unity3d.com/Manual/dotnetProfileSupport.html)

---

**최종 업데이트**: 2025-11-14
**Phase**: 1 (인프라 구축)
