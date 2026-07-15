let sdkPromise = null

const isSdkReady = () => Boolean(window.kakao?.maps?.Map)

export const loadKakaoMapSdk = () => {
  if (isSdkReady()) {
    return Promise.resolve(window.kakao.maps)
  }

  if (sdkPromise) {
    return sdkPromise
  }

  const appKey = import.meta.env.VITE_KAKAO_JS_KEY?.trim()
  if (!appKey) {
    return Promise.reject(
      new Error('카카오 지도 키가 설정되지 않았습니다. Netlify의 VITE_KAKAO_JS_KEY를 확인해주세요.')
    )
  }

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.dataset.kakaoMapSdk = 'true'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`
    script.async = true

    script.onload = () => {
      if (!window.kakao?.maps?.load) {
        sdkPromise = null
        reject(
          new Error(
            `카카오 지도 인증에 실패했습니다. JavaScript 키와 SDK 도메인(${window.location.origin})을 확인해주세요.`
          )
        )
        return
      }

      window.kakao.maps.load(() => {
        if (isSdkReady()) {
          resolve(window.kakao.maps)
          return
        }

        sdkPromise = null
        reject(new Error('카카오 지도 SDK 초기화에 실패했습니다.'))
      })
    }

    script.onerror = () => {
      sdkPromise = null
      script.remove()
      reject(
        new Error(
          `카카오 지도 SDK를 불러오지 못했습니다. JavaScript 키와 SDK 도메인(${window.location.origin})을 확인해주세요.`
        )
      )
    }

    document.head.appendChild(script)
  })

  return sdkPromise
}
