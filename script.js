  <script>
    (function() {
      // ── Konfigurasi ──
      const STORAGE_KEY = 'wa_gate_passed_v5';
      const GATE_EXPIRY_DAYS = 1;
      const VERIFY_DELAY_MS = 2200;

      // ── DOM ──
      const gateCard = document.getElementById('gateCard');
      const btnFollowWA = document.getElementById('btnFollowWA');
      const btnConfirm = document.getElementById('btnConfirm');
      const verifyMessageBox = document.getElementById('verifyMessageBox');
      const verifyIcon = document.getElementById('verifyIcon');
      const verifyText = document.getElementById('verifyText');

      const stepDot1 = document.getElementById('stepDot1');
      const stepDot2 = document.getElementById('stepDot2');
      const stepDot3 = document.getElementById('stepDot3');
      const stepLine1 = document.getElementById('stepLine1');
      const stepLine2 = document.getElementById('stepLine2');
      const stepLabel1 = document.getElementById('stepLabel1');
      const stepLabel2 = document.getElementById('stepLabel2');
      const stepLabel3 = document.getElementById('stepLabel3');

      // ── State ──
      let followClickCount = 0;
      let confirmAttempts = 0;
      let isVerifying = false;
      let gateRemoved = false;
      let hasClickedFollowOnce = false;

      // ── localStorage ──
      function isAlreadyPassed() {
        try {
          const data = localStorage.getItem(STORAGE_KEY);
          if (!data) return false;
          const parsed = JSON.parse(data);
          if (parsed.expiresAt && Date.now() < parsed.expiresAt) return true;
          localStorage.removeItem(STORAGE_KEY);
          return false;
        } catch (e) {
          return false;
        }
      }

      function setPassed() {
        const expiresAt = Date.now() + (GATE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          passed: true,
          timestamp: Date.now(),
          expiresAt: expiresAt,
        }));
      }

      function removeGateUI() {
        if (gateRemoved) return;
        gateRemoved = true;
        gateCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        gateCard.style.opacity = '0';
        gateCard.style.transform = 'scale(0.94)';
        setTimeout(() => {
          if (gateCard.parentNode) {
            gateCard.parentNode.style.transition = 'opacity 0.3s ease';
            gateCard.parentNode.style.opacity = '0';
          }
          setTimeout(() => {
            if (gateCard.parentNode && gateCard.parentNode.parentNode) {
              gateCard.parentNode.parentNode.style.transition = 'opacity 0.25s ease';
              gateCard.parentNode.parentNode.style.opacity = '0';
            }
            setTimeout(() => {
              document.body.innerHTML = '';
              document.body.style.overflow = '';
              document.body.style.position = '';
              document.body.style.width = '';
              document.body.style.display = 'none';
            }, 300);
          }, 250);
        }, 450);
      }

      // ── Step Indicator ──
      function updateStepIndicator(step) {
        [stepDot1, stepDot2, stepDot3].forEach(d => {
          d.classList.remove('active', 'done');
        });
        [stepLine1, stepLine2].forEach(l => {
          l.classList.remove('active');
        });
        [stepLabel1, stepLabel2, stepLabel3].forEach(l => {
          l.classList.remove('active', 'done');
        });

        if (step >= 1) {
          stepDot1.classList.add('done');
          stepLabel1.classList.add('done');
        }
        if (step >= 2) {
          stepDot1.classList.add('done');
          stepDot2.classList.add('active');
          stepLine1.classList.add('active');
          stepLabel1.classList.add('done');
          stepLabel2.classList.add('active');
        }
        if (step >= 3) {
          stepDot1.classList.add('done');
          stepDot2.classList.add('done');
          stepDot3.classList.add('done');
          stepLine1.classList.add('active');
          stepLine2.classList.add('active');
          stepLabel1.classList.add('done');
          stepLabel2.classList.add('done');
          stepLabel3.classList.add('done');
        }
      }

      function enableConfirmButton() {
        btnConfirm.disabled = false;
        btnConfirm.classList.add('active');
        btnConfirm.textContent = 'Saya Sudah Follow';
        updateStepIndicator(2);
      }

      function resetConfirmButton() {
        btnConfirm.disabled = true;
        btnConfirm.classList.remove('active');
        btnConfirm.textContent = 'Saya Sudah Follow';
      }

      // ── Verifikasi ──
      function showVerificationMessage(type, message) {
        verifyMessageBox.style.display = 'flex';
        verifyMessageBox.className = 'verify-message ' + type;
        if (type === 'loading') {
          verifyIcon.innerHTML = '<span class="spinner"></span>';
        } else if (type === 'error') {
          verifyIcon.innerHTML = '⚠️';
        } else if (type === 'success') {
          verifyIcon.innerHTML = '✅';
        }
        verifyText.innerHTML = message;
      }

      function hideVerificationMessage() {
        verifyMessageBox.style.display = 'none';
        verifyMessageBox.className = 'verify-message';
      }

      function startVerification() {
        if (isVerifying || gateRemoved) return;
        isVerifying = true;
        confirmAttempts++;
        btnConfirm.disabled = true;
        btnConfirm.classList.remove('active');
        hideVerificationMessage();
        showVerificationMessage('loading', 'Sistem sedang memverifikasi status follow kamu. Proses ini hanya memerlukan beberapa saat. Mohon jangan tutup atau tinggalkan halaman ini...');

        setTimeout(() => {
          if (followClickCount >= 2) {
            showVerificationMessage('success', 'Verifikasi berhasil. Terima kasih telah mengikuti saluran WhatsApp. Mengalihkan ke halaman berikutnya...');
            updateStepIndicator(3);
            btnConfirm.style.display = 'none';
            setPassed();
            setTimeout(() => {
              removeGateUI();
            }, 1000);
            isVerifying = false;
          } else if (confirmAttempts === 1) {
            showVerificationMessage('error', ' <b>Verifikasi gagal.</b> Kami belum dapat mendeteksi bahwa kamu telah mengikuti saluran WhatsApp. Silakan buka kembali saluran melalui tombol <b>Buka Saluran WhatsApp</b>, pastikan kamu menekan tombol <b>Ikuti</b>, kemudian kembali ke halaman ini dan klik <b>Coba Lagi</b>.');
            btnConfirm.disabled = false;
            btnConfirm.classList.add('active');
            btnConfirm.textContent = 'Coba Lagi';
            updateStepIndicator(2);
            isVerifying = false;
          } else {
            showVerificationMessage('error', ' <b>Verifikasi gagal.</b> Sistem mendeteksi bahwa kamu <b>belum mengikuti saluran WhatsApp</b>. Silakan klik <b>Buka Saluran WhatsApp</b>, pilih <b>Lihat di WhatsApp</b> jika muncul, lalu tekan tombol <b>Ikuti</b> pada saluran. Setelah benar-benar mengikuti saluran, kembali ke halaman ini dan klik <b>Coba Lagi</b>.');
            btnConfirm.disabled = false;
            btnConfirm.classList.add('active');
            btnConfirm.textContent = 'Coba Lagi';
            updateStepIndicator(2);
            isVerifying = false;
          }
        }, VERIFY_DELAY_MS);
      }

      // ── Event Listeners ──
      let waitingForWhatsApp = false;

      btnFollowWA.addEventListener('click', function () {
        waitingForWhatsApp = true;
        followClickCount++;
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden && waitingForWhatsApp) {
          waitingForWhatsApp = false;
          if (!hasClickedFollowOnce) {
            hasClickedFollowOnce = true;
            enableConfirmButton();
          }
          if (followClickCount >= 2 && confirmAttempts >= 1 && !gateRemoved) {
            hideVerificationMessage();
            btnConfirm.textContent = "Coba Lagi";
            btnConfirm.disabled = false;
            btnConfirm.classList.add("active");
            updateStepIndicator(2);
          }
        }
      });

      btnConfirm.addEventListener('click', function() {
        if (btnConfirm.disabled || isVerifying || gateRemoved) return;
        if (!hasClickedFollowOnce) return;
        startVerification();
      });

      // ── Init ──
      function init() {
        if (isAlreadyPassed()) {
          removeGateUI();
          return;
        }
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        hideVerificationMessage();
        resetConfirmButton();
        updateStepIndicator(0);
        stepDot1.classList.add('active');
        stepLabel1.classList.add('active');
      }

      init();
    })();
  </script>
