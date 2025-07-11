import React from 'react'

type Props = {
  className?: string
}
const MiniCat = ({ className = '' }: Props) => {
  return (
    <svg className={className} width="56" height="70" viewBox="0 0 56 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.2227 8.72137L18.6537 8.28391C18.6537 8.28391 19.3452 5.25295 21.0665 4.73588C21.1176 4.72025 21.1716 4.71356 21.2248 4.71059C21.3583 4.70314 21.661 4.65776 21.9491 4.42192L23.6376 3.03663L24.076 2.6944C24.4086 2.43475 24.8586 2.39532 25.2299 2.59322L27.2109 3.64967C27.5523 3.83194 27.766 4.19203 27.766 4.58411L27.766 5.00446C27.766 6.57574 28.3152 8.0942 29.3123 9.29201C30.2605 10.431 31.4925 11.6006 32.5552 11.6006L41.5296 11.3938C41.895 11.3856 42.2546 11.2985 42.5843 11.1378C44.1168 10.3909 48.7134 7.91713 52.2166 3.608C52.4887 3.27322 52.6404 2.85436 52.6404 2.41987L52.6404 1.50254C52.6404 0.872391 53.0124 0.292832 53.5923 0.074845C53.9023 -0.041961 54.2502 -0.0456765 54.5762 0.236291C54.8527 0.475106 54.9993 0.835938 54.9993 1.2057L54.9993 3.79549C54.9993 4.24783 54.8403 4.68455 54.5522 5.02827C54.2845 5.34669 53.9511 5.78117 53.7119 6.21937C53.2721 7.02361 52.7506 7.77876 52.1787 8.49149L46.0591 16.1262C45.4326 16.9081 44.6842 17.5777 43.8469 18.1164C43.2911 18.4735 42.577 19.152 41.9665 20.4324C41.7776 20.8282 41.7528 21.2827 41.8834 21.7023C42.0241 22.1532 42.1758 23.0192 42.2014 24.673C42.2087 25.1358 42.3728 25.5814 42.6704 25.9311C43.1 26.4363 43.9118 27.1282 45.4318 27.8104C45.9636 28.0492 46.4814 28.32 46.9862 28.6139L50.3567 30.5788C50.8228 30.8503 51.3501 30.9932 51.887 30.9932C52.3034 30.9932 52.6835 30.7528 52.8709 30.3734C53.1342 29.84 53.6506 29.1816 54.5551 29.3586C54.938 29.433 55.213 29.7782 55.213 30.1763L55.213 32.7326C55.213 33.269 54.8118 33.731 54.2874 33.7622C54.2626 33.7637 54.2378 33.7645 54.2123 33.7645L52.3436 33.7645C51.0489 33.7645 49.7615 33.5718 48.523 33.1871C47.2473 32.7913 45.1087 32.3234 41.9818 32.243C41.6791 32.2349 41.4041 32.4216 41.2911 32.708C40.8994 33.7072 40.0971 36.1065 40.464 38.1978C40.6412 39.2097 40.7492 40.2334 40.7907 41.2601L40.9899 46.2313C40.9899 46.2313 43.1518 46.5989 45.054 48.6255C45.4851 49.0852 45.9424 49.519 46.4355 49.9088L47.6463 50.8663C48.1503 51.2644 48.7688 51.4809 49.4063 51.4809L49.8388 51.4809C50.2167 51.4809 50.5821 51.3432 50.8687 51.0925L52.9205 49.2988C53.2429 49.0168 53.4355 48.6106 53.4522 48.1776L53.4727 47.636C53.496 47.0177 53.7914 46.4337 54.2932 46.0863C54.6185 45.8608 55.016 45.7388 55.4303 45.9687C55.7885 46.1681 56 46.5632 56 46.979L56 49.9713C56 50.0971 55.9468 50.2168 55.8541 50.3002L50.0671 55.4917C50.0671 55.4917 48.2801 57.1686 44.7776 55.9291C44.7776 55.9291 41.5157 54.7507 42.3465 57.1247C42.3793 57.2192 42.418 57.3107 42.4588 57.4015C42.5996 57.7184 43.0949 58.9154 43.631 61.2143C43.7331 61.6518 43.806 62.0952 43.8666 62.5409C43.9796 63.3704 44.6952 65.516 48.9657 66.7897C49.4559 66.9355 49.9643 67.0107 50.4749 67.0107L51.6382 67.0107C52.1831 67.0107 52.7061 67.2607 53.0292 67.7085C53.3217 68.114 53.4435 68.6653 52.8199 69.2843C52.3479 69.753 51.7053 70 51.0467 70C50.8702 70 50.6944 69.9836 50.5208 69.9509L47.5201 69.3855C46.5996 69.2121 45.701 68.9383 44.8389 68.5678L41.488 67.129C40.9964 66.9177 40.5639 66.5881 40.2269 66.1663C39.472 65.2222 37.9002 63.4314 36.0745 62.363C35.3845 61.9591 34.6223 61.6987 33.8367 61.5722L25.8039 60.2784C25.3335 60.2025 24.8528 60.3208 24.4684 60.6087C21.6508 62.7179 9.30145 71.1747 2.17749 63.0728C2.17749 63.0728 -2.37172 57.9237 1.68078 53.7991C2.36713 53.1005 3.36932 52.8066 4.30294 53.0745C5.00826 53.2776 5.5006 53.75 4.64721 54.8303C4.35837 55.1956 4.11694 55.5966 3.94699 56.0325C3.35254 57.5555 2.88646 60.5641 7.81131 61.6191C10.1155 62.1123 12.5115 61.971 14.7471 61.2181C16.9535 60.4756 19.6493 59.0151 21.3692 56.1486C21.529 55.8822 21.5873 55.5646 21.5326 55.2573C21.1293 52.9837 19.607 42.2793 23.3349 26.6193C23.3349 26.6193 25.2649 20.6407 21.5479 17.3605C21.5479 17.3605 18.9032 15.1003 18.6172 12.4026L15.2219 8.72063L15.2227 8.72137Z"
        fill="currentColor"
        stroke="currentColor"
      />
      <path d="M22.032 6C22.032 6 23.3319 6.83166 22.919 8.38299C22.5057 9.93381 20.9675 10 20.9675 10C20.9675 10 19.6684 9.16903 20.0809 7.61735C20.4938 6.06619 22.032 6 22.032 6Z" fill="#2CCBAB" />
      <path d="M21.0001 7C22.3333 7 22.3333 8 21.0001 8C19.6669 8 19.6663 7 21.0001 7Z" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}

export default MiniCat
