
        // Init icon SVG
        lucide.createIcons();

        // Data Array State
        let criteria = [];
        let rawAlternatives = []; 
        let altNames = []; 

        // Fungsi Render Tabel Kriteria
        function renderCriteria() {
            const tbody = document.getElementById('criteria-body');
            tbody.innerHTML = '';
            criteria.forEach((c, index) => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-100 hover:bg-gray-50 transition-colors";
                tr.innerHTML = `
                    <td class="py-3 px-4 font-medium text-gray-600 bg-gray-50 rounded-l w-16 text-center border-r">C${index + 1}</td>
                    <td class="py-3 px-4">
                        <input type="text" value="${c.name}" onchange="updateCriteria(${index}, 'name', this.value)" placeholder="Nama kriteria" class="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                    </td>
                    <td class="py-3 px-4">
                        <input type="number" value="${c.weight}" onchange="updateCriteria(${index}, 'weight', parseFloat(this.value))" class="w-full min-w-[70px] max-w-[100px] px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" min="0" step="0.1">
                    </td>
                    <td class="py-3 px-4">
                        <select onchange="updateCriteria(${index}, 'type', this.value)" class="w-full min-w-[100px] px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-all text-sm">
                            <option value="Benefit" ${c.type === 'Benefit' ? 'selected' : ''}>Manfaat (Benefit)</option>
                            <option value="Cost" ${c.type === 'Cost' ? 'selected' : ''}>Biaya (Cost)</option>
                        </select>
                    </td>
                    <td class="py-3 px-4">
                        <select onchange="updateCriteria(${index}, 'scale', this.value)" class="w-full min-w-[90px] px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-all text-sm">
                            <option value="1-10" ${c.scale === '1-10' ? 'selected' : ''}>1 - 10</option>
                            <option value="1-100" ${c.scale === '1-100' ? 'selected' : ''}>1 - 100</option>
                        </select>
                    </td>
                    <td class="py-3 px-4 rounded-r">
                        <button onclick="removeCriteria(${index})" class="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 hover:text-red-700 transition-colors font-medium text-sm flex items-center border border-red-100 w-full justify-center">
                            <i data-lucide="trash-2" class="w-4 h-4 mr-1.5"></i> Hapus
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            lucide.createIcons();
        }

        function addCriteria(name = '', weight = 1, type = 'Benefit', scale = '1-100') {
            criteria.push({ name, weight, type, scale });
            renderCriteria();
        }

        function removeCriteria(index) {
            if(confirm('Apakah Anda yakin ingin menghapus kriteria C' + (index + 1) + '?')) {
                criteria.splice(index, 1);
                
                // Hapus juga sinkronasi array alternatif di kolom yb jika sudah ada datanya
                rawAlternatives.forEach(alt => {
                    if (alt.length > index) {
                        alt.splice(index, 1);
                    }
                });
                renderCriteria();
                
                // Segarkan bagian alternatif jika di tampilkan
                if (!document.getElementById('alternatives-section').classList.contains('hidden')) {
                     renderAlternatives();
                }
            }
        }

        function updateCriteria(index, field, value) {
            criteria[index][field] = value;
            if (field === 'name') {
                 if (!document.getElementById('alternatives-section').classList.contains('hidden')) {
                     renderAlternatives();
                 }
            }
        }

        // Add dummy base kriteria rows jika dibuka kosongan 
        // addCriteria('', 1, 'Benefit', '1-100');

        // Fungsi Parse File (Upload CSV / Excel)
        function handleFileUpload() {
            const fileInput = document.getElementById('csv-file');
            const file = fileInput.files[0];
            if (!file) {
                alert("Pilih file CSV atau Excel yang akan dieksekusi terlebih dahulu.");
                return;
            }

            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.csv')) {
                // Parse CSV
                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        processDataset(results.data);
                    },
                    error: function(err) {
                        alert('Terjadi kesalahan memproses file CSV: ' + err.message);
                    }
                });
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Parse Excel
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const dataObj = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(dataObj, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        // Convert directly to JSON exactly like PapaParse
                        const json = XLSX.utils.sheet_to_json(worksheet, { defval: 0 });
                        processDataset(json);
                    } catch (error) {
                        alert('Gagal mengekstrak data Excel. Pastikan file valid.');
                        console.error(error);
                    }
                };
                reader.onerror = function(err) {
                    alert('Terjadi kesalahan memproses file Excel.');
                };
                reader.readAsArrayBuffer(file);
            } else {
                alert("Format file tidak didukung. Harap unggah CSV atau Excel (.xlsx/.xls)");
            }
        }

        // Logical Flow untuk Parsing Dataset
        function processDataset(data) {
            if (data.length === 0) {
                alert("File terdeteksi kosong atau salah format!");
                return;
            }

            const headers = Object.keys(data[0]);
            if(headers.length < 2) {
                alert("Gagal. File terdeteksi hanya memiliki " + headers.length + " kolom.\n\nSistem memerlukan minimal 2 kolom (1 untuk Alternatif, sisanya untuk Kriteria).\n\n💡 TIPS: Jika CSV dari Excel, separator kemungkinan salah (;).");
                return;
            }

            // Deteksi Kolom
            const altNameCol = headers[0];
            const criteriaCols = headers.slice(1);

            // Buat Data Array Kriteria (via header file)
            criteria = [];
            criteriaCols.forEach(col => {
                let guessType = col.toLowerCase().includes('biaya') || col.toLowerCase().includes('harga') ? 'Cost' : 'Benefit';
                criteria.push({ name: col, weight: 1, type: guessType, scale: '1-100' });
            });
            renderCriteria();

            // Buat Data Alternatif
            altNames = [];
            rawAlternatives = [];
            data.forEach(item => {
                altNames.push(item[altNameCol] || 'Tanpa Nama');
                const vals = criteriaCols.map(col => parseFloat(item[col]) || 0); // Convert to Float
                rawAlternatives.push(vals);
            });

            renderAlternatives();
            document.getElementById('csv-file').value = ''; // clear instance
            
            // Notif feedback sederhana
            const alertDiv = document.createElement("div");
            alertDiv.className = "flex bg-green-100 text-green-800 p-3 mt-4 rounded-md border border-green-200 shadow-sm font-medium items-center text-sm";
            alertDiv.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5 mr-2"></i> File Berhasil diimpor. Silahkan sesuaikan Bobot dan Tipe Kriteria di tabel atas.';
            const rootNode = document.getElementById("csv-file").parentNode.parentNode;
            rootNode.appendChild(alertDiv);
            lucide.createIcons();
            setTimeout(()=> { alertDiv.remove(); }, 6000);
        }

        // Fungsi Render Tabel Alternatif
        function renderAlternatives() {
            const section = document.getElementById('alternatives-section');
            section.classList.remove('hidden');

            const thead = document.getElementById('alt-head');
            thead.innerHTML = `<tr>
                <th class="py-3 px-4 font-semibold bg-gray-100 text-gray-800 text-center border-r w-12 rounded-tl-lg">No</th>
                <th class="py-3 px-4 font-semibold text-gray-800 border-r min-w-[150px]">Nama Alternatif</th>
                ${criteria.map(c => `<th class="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">${c.name || '-'}</th>`).join('')}
            </tr>`;

            const tbody = document.getElementById('alt-body');
            tbody.innerHTML = '';
            
            rawAlternatives.forEach((altData, idx) => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-100 hover:bg-gray-50 transition-colors";
                tr.innerHTML = `
                    <td class="py-2 px-4 text-center text-gray-500 bg-gray-50 border-r font-medium">${idx + 1}</td>
                    <td class="py-2 px-4 font-semibold text-gray-700 border-r">${altNames[idx] || 'Alt ' + (idx + 1)}</td>
                    ${altData.map(v => `<td class="py-2 px-4 text-gray-600">${v}</td>`).join('')}
                `;
                tbody.appendChild(tr);
            });
        }

        // Fungsi Induk Algoritma CPI
        function calculateCPI() {
            if(rawAlternatives.length === 0 || criteria.length === 0) {
                alert("Harap masukkan Data Variabel Alternatif  dan Kriteria terlebih dahulu."); return;
            }
            if(criteria.length !== rawAlternatives[0].length) {
                alert("Inkonsistensi terdeteksi. Jumlah kriteria tidak sinkron dengan jumlah skor nilai yang tersedia dari CSV.");
                return;
            }
            
            const nCrit = criteria.length;
            const nAlt = rawAlternatives.length;

            // 1. Mencari Nilai Minimum (x_min) tiap kriteria
            const xMin = new Array(nCrit).fill(0);
            for (let j = 0; j < nCrit; j++) {
                let colValues = rawAlternatives.map(row => row[j]);
                xMin[j] = Math.min(...colValues);
            }

            // 2. Transformasi Kinerja (Hitung Indeks I)
            const I = [];
            for (let i = 0; i < nAlt; i++) {
                I.push(new Array(nCrit).fill(0));
            }

            for (let i = 0; i < nAlt; i++) {
                for (let j = 0; j < nCrit; j++) {
                    const x_ij = rawAlternatives[i][j];
                    if (criteria[j].type === 'Benefit') {
                        // Trend Positif (Benefit)
                        if (xMin[j] !== 0) {
                            I[i][j] = (x_ij / xMin[j]) * 100;
                        } else {
                             I[i][j] = 0; // fallback divide by zero
                        }
                    } else {
                        // Trend Negatif (Cost)
                        if (x_ij !== 0) {
                            I[i][j] = (xMin[j] / x_ij) * 100;
                        } else {
                             I[i][j] = 0; // fallback divide by zero
                        }
                    }
                }
            }

            // 3. Hitung Nilai Alternatif (V_ij) dan Total CPI
            const results = [];
            for (let i = 0; i < nAlt; i++) {
                let totalCPI = 0;
                let V_i = new Array(nCrit).fill(0);
                
                for (let j = 0; j < nCrit; j++) {
                    V_i[j] = I[i][j] * criteria[j].weight;
                    totalCPI += V_i[j];
                }

                results.push({
                    kode: 'A' + (i + 1),
                    alt: altNames[i] || 'Alternatif ' + (i + 1),
                    V: V_i,
                    CPI: totalCPI
                });
            }

            // Simpan array order original
            const resultsOriginalOrder = [...results];
            // 4. Perankingan Akhir SPK CPI (Berdasarkan Nilai CPI yang TERBESAR = TERBAIK)
            results.sort((a, b) => b.CPI - a.CPI);
            
            // Simpan referensi ke global state untuk fitur Export
            window.cpiResults = results;

            // Tampilkan (Render) Hasil secara Visual
            const resSection = document.getElementById('result-section');
            resSection.classList.remove('hidden');
            
            resSection.innerHTML = \`
                <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                        <i data-lucide="bar-chart-2" class="w-6 h-6 mr-2 text-indigo-600"></i> Hasil Analisis Akhir
                    </h2>
                    <button onclick="exportResultsToExcel()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium flex items-center justify-center transition-colors">
                        <i data-lucide="download" class="w-4 h-4 mr-2"></i> Ekspor Ranking (Excel)
                    </button>
                </div>

                <!-- Langkah 1 -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center mb-1">
                        <i data-lucide="edit-3" class="w-6 h-6 mr-2 text-indigo-600"></i> Langkah Perhitungan
                    </h2>
                    
                    <div class="mt-6">
                        <h3 class="text-lg font-bold text-gray-800">Langkah 1 : Matriks Keputusan</h3>
                        <p class="text-gray-500 mb-4 text-sm">Nilai awal setiap alternatif untuk setiap kriteria</p>
                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-center text-sm border-collapse">
                                <thead class="bg-gray-50 text-gray-700">
                                    <tr>
                                        \${criteria.map((c, i) => \`<th class="py-3 px-4 font-bold border">C\${i+1}</th>\`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    \${rawAlternatives.map(row => \`
                                        <tr>
                                            \${row.map(val => \`<td class="py-3 px-4 border text-gray-700">\${val.toFixed(2)}</td>\`).join('')}
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Langkah 2 -->
                    <div class="mt-8">
                        <h3 class="text-lg font-bold text-gray-800">Langkah 2: Nilai Minimum tiap Kriteria</h3>
                        <p class="text-gray-500 mb-4 text-sm">Nilai terkecil dari masing-masing kriteria</p>
                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left text-sm border-collapse">
                                <tbody>
                                    <tr>
                                        <td class="py-3 px-4 font-bold border bg-gray-50 text-gray-800 w-48">Nilai Min (x_min)</td>
                                        \${xMin.map((val, i) => \`<td class="py-3 px-4 border text-gray-700 font-semibold whitespace-nowrap"><b>C\${i+1} :</b> \${val}</td>\`).join('')}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Langkah 3 -->
                    <div class="mt-8">
                        <h3 class="text-lg font-bold text-gray-800">Langkah 3: Transformasi Kinerja (Indeks)</h3>
                        <p class="text-gray-500 mb-4 text-sm">Benefit = (x_ij / x_min) * 100 | Cost = (x_min / x_ij) * 100</p>

                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-center text-sm border-collapse">
                                <thead class="bg-gray-50 text-gray-700">
                                    <tr>
                                        \${criteria.map((c, i) => \`<th class="py-3 px-4 font-bold border">C\${i+1}</th>\`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    \${I.map((row) => \`
                                        <tr>
                                            \${row.map(val => \`<td class="py-3 px-4 border text-gray-700">\${val.toFixed(2)}</td>\`).join('')}
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Langkah 4 -->
                    <div class="mt-8">
                        <h3 class="text-lg font-bold text-gray-800">Langkah 4: Nilai Akhir (V_ij) & Total CPI</h3>
                        <p class="text-gray-500 mb-4 text-sm">V_ij = Indeks x Bobot. Nilai CPI = Total dari V_ij</p>

                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-center text-sm border-collapse bg-white">
                                <thead class="bg-gray-50 text-gray-700">
                                    <tr>
                                        <th class="py-3 px-4 font-bold border">Alternatif</th>
                                        \${criteria.map((c, i) => \`<th class="py-3 px-4 font-bold border">C\${i+1} (×\${c.weight})</th>\`).join('')}
                                        <th class="py-3 px-4 font-bold border bg-indigo-50">Total CPI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${resultsOriginalOrder.map((res) => \`
                                        <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td class="py-3 px-4 border text-left font-bold text-gray-800">\${res.kode} (\${res.alt})</td>
                                            \${res.V.map(val => \`<td class="py-3 px-4 border text-gray-700">\${val.toFixed(2)}</td>\`).join('')}
                                            <td class="py-3 px-4 border font-bold text-indigo-700 bg-indigo-50/30">\${res.CPI.toFixed(2)}</td>
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Langkah 5 -->
                    <div class="mt-8">
                        <h3 class="text-lg font-bold text-gray-800">Langkah 5: Perankingan</h3>
                        <p class="text-gray-500 mb-4 text-sm">Ranking berdasarkan nilai CPI tertinggi</p>
                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left text-sm border-collapse bg-white">
                                <thead class="bg-gray-50 text-gray-700">
                                    <tr>
                                        <th class="py-3 px-4 font-bold border">Peringkat</th>
                                        <th class="py-3 px-4 font-bold border">Kode</th>
                                        <th class="py-3 px-4 font-bold border">Nama Alternatif</th>
                                        <th class="py-3 px-4 font-bold border">Skor CPI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${results.map((res, index) => \`
                                        <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td class="py-3 px-4 border font-bold text-gray-800 text-center w-24">\${index + 1}</td>
                                            <td class="py-3 px-4 border font-bold text-gray-800 w-32">\${res.kode}</td>
                                            <td class="py-3 px-4 border text-gray-800">\${res.alt}</td>
                                            <td class="py-3 px-4 border text-gray-800 font-bold w-48">\${res.CPI.toFixed(2)}</td>
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                <!-- Pemenang -->
                <div class="bg-[#f4fbfc] p-8 rounded-xl flex items-center justify-between mt-6 border border-blue-50">
                    <div>
                        <p class="text-sm font-bold text-gray-800 mb-1">Alternatif Terbaik</p>
                        <h2 class="text-3xl font-extrabold text-[#0091d5] mb-2">\${results[0].alt}</h2>
                        <p class="text-gray-500 text-sm">Skor: \${results[0].CPI.toFixed(2)}</p>
                    </div>
                    <div>
                        <img src="https://cdn-icons-png.flaticon.com/512/179/179249.png" alt="Medal" class="w-24 h-24 drop-shadow-md">
                    </div>
                </div>

                <!-- Visualisasi -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center mb-6">
                        <i data-lucide="bar-chart" class="w-6 h-6 mr-2 text-blue-600"></i> Visualisasi
                    </h2>
                    <canvas id="scoreChart" height="100"></canvas>
                </div>
            \`;

            // Draw Chart.js Bar Chart
            const ctx = document.getElementById('scoreChart').getContext('2d');
            if(window.myChart) {
                window.myChart.destroy();
            }
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: results.map(r => r.kode),
                    datasets: [{
                        label: 'Skor CPI',
                        data: results.map(r => r.CPI),
                        backgroundColor: '#0ea5e9',
                        barPercentage: 0.8
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#e2e8f0', borderDash: [5, 5] }
                        },
                        x: {
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6 } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const res = results[context.dataIndex];
                                    return \`\${res.alt}: \${res.CPI.toFixed(2)}\`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Re-bind ulang icon setelah suntik dom
            lucide.createIcons();
            
            // Otomatis scroll untuk memudahkan visual navigasi UX
            resSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Fungsi Tambahan untuk Ekspor Hasil ke Excel
        function exportResultsToExcel() {
            if (!window.cpiResults || window.cpiResults.length === 0) {
                alert("Belum ada hasil kalkulasi untuk diekspor!");
                return;
            }
            
            // Transformasi data untuk header yang spesifik
            const exportData = window.cpiResults.map((res, index) => ({
                "Peringkat": index + 1,
                "ID Alternatif": res.kode,
                "Nama Alternatif": res.alt,
                "Skor CPI": res.CPI
            }));

            // SheetJS routine
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ranking CPI");
            
            // Download payload
            XLSX.writeFile(workbook, "Hasil_Perankingan_CPI.xlsx");
        }
    