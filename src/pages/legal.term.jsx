import React from 'react'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/atoms/Button.jsx'

export const Terms = () => {
  const navigate = useNavigate()
  const [activeLang, setActiveLang] = React.useState('en')

  const handleBack = () => {
    try {
      if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
        window.close()
        return
      }
      if (typeof window !== 'undefined' && window.history && window.history.length <= 1) {
        window.close()
        return
      }
    } catch (e) {}
    navigate(-1)
  }

  return (
    <AppLayout showFooter={false} enableStableScrollbar={false}>
      {/* Main container styled to match original dimensions/positions */}
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-lg border-2 border-[#f0f0f0] shadow-md p-8">
          {/* Title */}
          <h1 className="font-medium text-gray-900 text-xl text-center leading-normal underline mb-6">
            Terms &amp; Conditions
          </h1>

          {/* Content */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setActiveLang('en')}
                className={[
                  'px-3 py-1 text-sm rounded-md',
                  activeLang === 'en' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'
                ].join(' ')}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('id')}
                className={[
                  'ml-1 px-3 py-1 text-sm rounded-md',
                  activeLang === 'id' ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-800'
                ].join(' ')}
              >
                Bahasa Indonesia
              </button>
            </div>
          </div>

          <div className="max-h-[576px] overflow-y-auto tutor-scroll font-normal text-gray-600 text-base leading-normal space-y-4">
            {activeLang === 'en' ? (
              <div className="space-y-4">
                <p><strong>1. Acceptance of Terms.</strong> By creating an account or using the Nova English website and services, you agree to these Terms &amp; Conditions and to our Privacy Policy. If you do not agree, please do not use the platform.</p>
                <p><strong>2. About the service.</strong> Nova English is an online platform that provides English tests, practice materials, and progress tracking for students, and tools for tutors to create and manage test content and review student performance. The platform is intended for learning and practice purposes and does not replace official language certifications unless explicitly stated by Nova English.</p>
                <p><strong>3. Eligibility and accounts.</strong> You must provide accurate and up-to-date information when registering, including your name, date of birth, and contact details. The system currently requires a minimum age of five years based on date of birth. You are responsible for keeping your login details confidential and for any activity that happens under your account. If we believe your account is being misused or accessed without permission, we may suspend or terminate access to protect you and other users.</p>
                <p><strong>4. Use of the platform.</strong> You agree to use Nova English only for lawful purposes and in accordance with these Terms. You must not misuse the platform, attempt to gain unauthorised access, interfere with the system or other users, attempt to bypass time limits or exam rules, copy or publish confidential test content outside Nova English without permission, or upload unlawful or offensive content. Tutors and administrators are responsible for ensuring that any questions, media, or feedback they create do not violate copyright and that student data is treated as confidential.</p>
                <p><strong>5. Test results and feedback.</strong> Nova English calculates scores and generates feedback based on the answers you submit and the grading rules set in the system. We aim to provide accurate and reliable scoring, but no automated system is perfect. Test scores and feedback are provided to support learning and internal evaluation. How the results are interpreted or used by schools or institutions is their responsibility, not Nova English’s.</p>
                <p><strong>6. Content and intellectual property.</strong> Unless stated otherwise, the Nova English platform, design, logos, and system features are owned or licensed by Nova English. Test questions, media, and other learning materials created by tutors may be owned by those tutors or by the organisation they represent. You may use the content only within Nova English for personal learning or teaching purposes. You may not copy, modify, distribute, sell, or reverse engineer any part of the platform or its content without our written permission.</p>
                <p><strong>7. Availability of service.</strong> We try to keep Nova English available and running smoothly, but we do not guarantee that the service will be available at all times. The platform may be temporarily unavailable due to maintenance, technical issues, or reasons beyond our control.</p>
                <p><strong>8. Suspension and termination.</strong> We may suspend or terminate your access to Nova English if you seriously or repeatedly violate these Terms &amp; Conditions, if we are required to do so by law or a competent authority, or if technical or security issues require us to restrict access. Students can also request account deletion from the Account Settings page, after which you may lose access to previous test history and results.</p>
                <p><strong>9. Changes to the service and to these terms.</strong> We may update or improve Nova English from time to time by adding features, changing layouts, or adjusting test flows. We may also update these Terms &amp; Conditions when needed. If the changes are significant, we will update this page and, where appropriate, notify you through the website or by email. Continuing to use Nova English after changes take effect means you accept the updated terms.</p>
                <p><strong>10. Contact.</strong> If you have questions about these Terms &amp; Conditions, you can contact us using the email or WhatsApp details shown in the footer of our website.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p><strong>1. Penerimaan syarat.</strong> Dengan membuat akun atau menggunakan website dan layanan Nova English, Anda menyetujui Syarat &amp; Ketentuan ini serta Kebijakan Privasi kami. Jika Anda tidak setuju, mohon untuk tidak menggunakan platform ini.</p>
                <p><strong>2. Tentang layanan.</strong> Nova English adalah platform online yang menyediakan tes bahasa Inggris, materi latihan, dan pemantauan progres untuk siswa, serta alat bagi tutor untuk membuat dan mengelola konten tes serta meninjau performa siswa. Platform ini ditujukan untuk keperluan belajar dan latihan dan tidak menggantikan sertifikasi bahasa resmi kecuali secara tegas dinyatakan sebaliknya oleh Nova English.</p>
                <p><strong>3. Kelayakan dan akun.</strong> Anda harus memberikan informasi yang akurat dan terbaru saat mendaftar, termasuk nama, tanggal lahir, dan detail kontak. Sistem saat ini menerapkan batas usia minimum lima tahun berdasarkan tanggal lahir. Anda bertanggung jawab menjaga kerahasiaan detail login dan atas semua aktivitas yang terjadi di akun Anda. Jika kami menduga akun Anda disalahgunakan atau diakses tanpa izin, kami dapat menangguhkan atau menghentikan akses untuk melindungi Anda dan pengguna lain.</p>
                <p><strong>4. Penggunaan platform.</strong> Anda setuju untuk menggunakan Nova English hanya untuk tujuan yang sah dan sesuai dengan Syarat &amp; Ketentuan ini. Anda tidak diperbolehkan menyalahgunakan platform, mencoba mengakses sistem tanpa izin, mengganggu sistem atau pengguna lain, mencoba mengakali batas waktu atau aturan ujian, menyalin atau mempublikasikan konten tes yang bersifat rahasia di luar Nova English tanpa izin, atau mengunggah konten yang melanggar hukum atau bersifat ofensif. Tutor dan administrator bertanggung jawab memastikan bahwa soal, media, atau umpan balik yang mereka buat tidak melanggar hak cipta dan bahwa data siswa diperlakukan sebagai informasi rahasia.</p>
                <p><strong>5. Hasil tes dan umpan balik.</strong> Nova English menghitung skor dan menghasilkan umpan balik berdasarkan jawaban yang Anda kirimkan dan aturan penilaian yang diatur di sistem. Kami berupaya memberikan penilaian yang akurat dan andal, namun tidak ada sistem otomatis yang sempurna. Skor dan umpan balik disediakan untuk mendukung proses belajar dan evaluasi internal. Cara hasil tersebut ditafsirkan atau digunakan oleh sekolah atau institusi menjadi tanggung jawab pihak tersebut, bukan Nova English.</p>
                <p><strong>6. Konten dan hak kekayaan intelektual.</strong> Kecuali dinyatakan lain, platform, desain, logo, dan fitur sistem Nova English dimiliki atau dilisensikan oleh Nova English. Soal tes, media, dan materi belajar lain yang dibuat oleh tutor dapat menjadi milik tutor tersebut atau organisasi yang diwakilinya. Anda hanya boleh menggunakan konten di dalam Nova English untuk keperluan belajar atau mengajar secara pribadi, dan tidak boleh menyalin, memodifikasi, mendistribusikan, menjual, atau melakukan reverse engineering terhadap bagian mana pun dari platform tanpa izin tertulis dari kami.</p>
                <p><strong>7. Ketersediaan layanan.</strong> Kami berupaya agar Nova English tetap tersedia dan berjalan dengan baik, namun kami tidak dapat menjamin layanan akan selalu tersedia setiap saat. Platform dapat sewaktu-waktu tidak tersedia karena pemeliharaan, masalah teknis, atau hal lain di luar kendali kami.</p>
                <p><strong>8. Penangguhan dan penghentian.</strong> Kami dapat menangguhkan atau menghentikan akses Anda ke Nova English jika Anda secara serius atau berulang kali melanggar Syarat &amp; Ketentuan ini, jika kami diwajibkan oleh hukum atau otoritas yang berwenang, atau jika ada masalah teknis atau keamanan yang mengharuskan kami membatasi akses. Siswa juga dapat meminta penghapusan akun dari halaman pengaturan akun, setelah itu Anda mungkin tidak lagi dapat mengakses riwayat tes dan hasil sebelumnya.</p>
                <p><strong>9. Perubahan layanan dan syarat.</strong> Kami dapat memperbarui atau meningkatkan Nova English dari waktu ke waktu, misalnya dengan menambah fitur, mengubah tampilan, atau menyesuaikan alur tes. Kami juga dapat memperbarui Syarat &amp; Ketentuan ini bila diperlukan. Jika ada perubahan penting, kami akan memperbarui halaman ini dan, bila perlu, memberi tahu Anda melalui website atau email. Penggunaan Nova English yang berkelanjutan setelah perubahan berlaku berarti Anda menyetujui Syarat &amp; Ketentuan yang telah diperbarui.</p>
                <p><strong>10. Kontak.</strong> Jika Anda memiliki pertanyaan tentang Syarat &amp; Ketentuan ini, silakan hubungi kami melalui email atau WhatsApp yang tercantum di footer website kami.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-10">
            <Button
              variant="primary"
              className="w-40 sm:w-56 h-10 sm:h-12 text-sm sm:text-base"
              onClick={handleBack}
              aria-label="Agree to terms and conditions"
            >
              I AGREE
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
