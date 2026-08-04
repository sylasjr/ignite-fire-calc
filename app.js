// IgniteFIRE Calculator App Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Dynamically set current year in footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Tab Navigation Logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Toggle active class on buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle active class on content sections
            tabContents.forEach(content => {
                if (content.id === `${targetTab}-content`) {
                    content.classList.add('active-content');
                } else {
                    content.classList.remove('active-content');
                }
            });

            // Trigger a chart resize if switching to calculator tab
            if (targetTab === 'calc-tab' && projectionChart) {
                setTimeout(() => {
                    projectionChart.resize();
                    projectionChart.update();
                }, 50);
            }
        });
    });

    // DOM Elements - Inputs (Sliding & Numeric)
    const currentAgeInput = document.getElementById('current-age');
    const currentAgeNum = document.getElementById('current-age-num');
    
    const targetAgeInput = document.getElementById('target-age');
    const targetAgeNum = document.getElementById('target-age-num');

    const netWorthInput = document.getElementById('net-worth');
    const netWorthSlider = document.getElementById('net-worth-slider');

    const annualSavingsInput = document.getElementById('annual-savings');
    const annualSavingsSlider = document.getElementById('annual-savings-slider');

    const annualExpensesInput = document.getElementById('annual-expenses');
    const annualExpensesSlider = document.getElementById('annual-expenses-slider');

    const investmentReturnInput = document.getElementById('investment-return');
    const investmentReturnNum = document.getElementById('investment-return-num');

    const swrInput = document.getElementById('swr');
    const swrNum = document.getElementById('swr-num');

    // DOM Elements - Metric Outputs
    const fireNumberOutput = document.getElementById('fire-number');
    const fireTimeOutput = document.getElementById('fire-time');
    const fireStatusOutput = document.getElementById('fire-status');
    const retireValueOutput = document.getElementById('retire-value');
    const retireValueDescOutput = document.getElementById('retire-value-desc');

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Expat Destination DOM Elements
    const expatLocationContainer = document.getElementById('expat-location-container');
    const expatCountrySelect = document.getElementById('expat-country-select');
    const expatCostNote = document.getElementById('expat-cost-note');

    // Chart variable
    let projectionChart = null;

    // ── FIRE Path Config ──
    const FIRE_PATHS = {
        traditional: {
            expenses: 60000,
            swr: 4.0,
            color: '#5E5CE6',
            borderColor: 'rgba(94, 92, 230, 0.35)',
            gradientColor: 'rgba(94, 92, 230, 0.15)'
        },
        lean: {
            expenses: 25000,
            swr: 3.5,
            color: '#30D158',
            borderColor: 'rgba(48, 209, 88, 0.35)',
            gradientColor: 'rgba(48, 209, 88, 0.15)'
        },
        fat: {
            expenses: 120000,
            swr: 4.0,
            color: '#BF5AF2',
            borderColor: 'rgba(191, 90, 242, 0.35)',
            gradientColor: 'rgba(191, 90, 242, 0.15)'
        },
        barista: {
            expenses: 40000,
            swr: 3.0,
            color: '#FF9F0A',
            borderColor: 'rgba(255, 159, 10, 0.35)',
            gradientColor: 'rgba(255, 159, 10, 0.15)'
        },
        expat: {
            expenses: 30000,
            swr: 3.5,
            color: '#64D2FF',
            borderColor: 'rgba(100, 210, 255, 0.35)',
            gradientColor: 'rgba(100, 210, 255, 0.15)'
        }
    };

    let activePath = 'traditional';

    // ── selectPath: activate chip, apply presets, update theme ──
    function selectPath(pathId, applyPresets = true) {
        if (!FIRE_PATHS[pathId]) return;
        activePath = pathId;
        const config = FIRE_PATHS[pathId];

        // 1. Update chip active states
        document.querySelectorAll('.path-chip').forEach(chip => {
            const isActive = chip.dataset.path === pathId;
            chip.classList.toggle('active', isActive);
            chip.setAttribute('aria-pressed', String(isActive));
        });

        // 2. Update global CSS theme variables so the whole app recolors
        const root = document.documentElement;
        root.style.setProperty('--theme-color', config.color);
        root.style.setProperty('--theme-color-glow', config.gradientColor.replace('0.15', '0.4'));
        root.style.setProperty('--theme-color-subtle', config.gradientColor);
        root.style.setProperty('--theme-color-border', config.borderColor);

        // 3. Apply accent color to control panel border
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            controlPanel.style.borderColor = config.borderColor;
        }

        // 3. Apply presets for expenses & SWR
        if (applyPresets) {
            annualExpensesInput.value = formatNumberWithCommas(config.expenses);
            annualExpensesSlider.value = config.expenses;
            swrNum.value = config.swr;
            swrInput.value = config.swr;
        }

        // 4. Update chart accent color
        if (projectionChart) {
            const ctx = document.getElementById('projectionChart').getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 350);
            grad.addColorStop(0, config.gradientColor);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            projectionChart.data.datasets[0].borderColor = config.color;
            projectionChart.data.datasets[0].pointHoverBackgroundColor = config.color;
            projectionChart.data.datasets[0].backgroundColor = grad;
            projectionChart.update('none');
        }

        // 5. Toggle Expat Destination Selector
        if (expatLocationContainer) {
            if (pathId === 'expat') {
                expatLocationContainer.classList.add('show');
            } else {
                expatLocationContainer.classList.remove('show');
                if (expatCostNote) expatCostNote.textContent = '';
                if (expatCountrySelect) expatCountrySelect.selectedIndex = 0;
            }
        }


        // 5. Persist selection
        localStorage.setItem('fire_activePath', pathId);
    }

    // Wire up chip click events
    document.querySelectorAll('.path-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            selectPath(chip.dataset.path, true);
            calculateFIRE();
            saveToStorage();
        });
    });

    // Helper to get CSS Variable values for Chart styling
    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // Number formatting helper (with commas)
    function formatNumberWithCommas(value) {
        let clean = value.toString().replace(/[^\d.]/g, '');
        let parts = clean.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    // Persist values in LocalStorage
    function saveToStorage() {
        localStorage.setItem('fire_currentAge', currentAgeNum.value.replace(/,/g, ''));
        localStorage.setItem('fire_targetAge', targetAgeNum.value.replace(/,/g, ''));
        localStorage.setItem('fire_netWorth', netWorthInput.value.replace(/,/g, ''));
        localStorage.setItem('fire_annualSavings', annualSavingsInput.value.replace(/,/g, ''));
        localStorage.setItem('fire_annualExpenses', annualExpensesInput.value.replace(/,/g, ''));
        localStorage.setItem('fire_investmentReturn', investmentReturnNum.value.replace(/,/g, ''));
        localStorage.setItem('fire_swr', swrNum.value.replace(/,/g, ''));
    }

    // Retrieve values from LocalStorage
    function loadFromStorage() {
        if (localStorage.getItem('fire_currentAge') !== null) {
            const val = localStorage.getItem('fire_currentAge');
            currentAgeNum.value = formatNumberWithCommas(val);
            currentAgeInput.value = val;
        }
        if (localStorage.getItem('fire_targetAge') !== null) {
            const val = localStorage.getItem('fire_targetAge');
            targetAgeNum.value = formatNumberWithCommas(val);
            targetAgeInput.value = val;
        }
        if (localStorage.getItem('fire_netWorth') !== null) {
            const val = localStorage.getItem('fire_netWorth');
            netWorthInput.value = formatNumberWithCommas(val);
            netWorthSlider.value = val;
        }
        if (localStorage.getItem('fire_annualSavings') !== null) {
            const val = localStorage.getItem('fire_annualSavings');
            annualSavingsInput.value = formatNumberWithCommas(val);
            annualSavingsSlider.value = val;
        }
        if (localStorage.getItem('fire_annualExpenses') !== null) {
            const val = localStorage.getItem('fire_annualExpenses');
            annualExpensesInput.value = formatNumberWithCommas(val);
            annualExpensesSlider.value = val;
        }
        if (localStorage.getItem('fire_investmentReturn') !== null) {
            const val = localStorage.getItem('fire_investmentReturn');
            investmentReturnNum.value = formatNumberWithCommas(val);
            investmentReturnInput.value = val;
        }
        if (localStorage.getItem('fire_swr') !== null) {
            const val = localStorage.getItem('fire_swr');
            swrNum.value = formatNumberWithCommas(val);
            swrInput.value = val;
        }
    }

    // Bidirectional sync for Sliders & Input Fields
    // Prevents auto-overwrite while backspacing/deleting inputs to type fresh values
    function setupBidirectionalSync(slider, number, onUpdate, isDecimal = false) {
        slider.addEventListener('input', () => {
            number.value = formatNumberWithCommas(slider.value);
            onUpdate();
            saveToStorage();
        });

        number.addEventListener('input', () => {
            let valStr = number.value;
            // Filter non-numeric characters while keeping separators
            if (isDecimal) {
                valStr = valStr.replace(/[^\d.,]/g, '');
            } else {
                valStr = valStr.replace(/[^\d,]/g, '');
            }
            
            const rawValStr = valStr.replace(/,/g, '');
            if (rawValStr !== "") {
                number.value = formatNumberWithCommas(rawValStr);
            } else {
                number.value = "";
            }

            // Stop syncing if the field is cleared or currently being typed
            if (rawValStr === "" || rawValStr === "." || rawValStr.endsWith('.')) {
                onUpdate();
                return;
            }
            
            const val = parseFloat(rawValStr);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            
            // Only update the slider if the typed value is within slider bounds
            if (!isNaN(val) && val >= min && val <= max) {
                slider.value = val;
            }
            onUpdate();
            saveToStorage();
        });

        number.addEventListener('blur', () => {
            const rawValStr = number.value.replace(/,/g, '');
            if (rawValStr === "" || isNaN(parseFloat(rawValStr))) {
                number.value = formatNumberWithCommas(slider.value);
            } else {
                // Apply boundary constraints strictly on blur
                const min = parseFloat(number.min);
                const max = parseFloat(number.max);
                let val = parseFloat(rawValStr);
                if (!isNaN(min) && val < min) val = min;
                if (!isNaN(max) && val > max) val = max;
                number.value = formatNumberWithCommas(val);
                slider.value = val;
            }
            onUpdate();
            saveToStorage();
        });
    }

    // Setup sync for all control variables
    setupBidirectionalSync(currentAgeInput, currentAgeNum, calculateFIRE);
    setupBidirectionalSync(targetAgeInput, targetAgeNum, calculateFIRE);
    setupBidirectionalSync(netWorthSlider, netWorthInput, calculateFIRE);
    setupBidirectionalSync(annualSavingsSlider, annualSavingsInput, calculateFIRE);
    setupBidirectionalSync(annualExpensesSlider, annualExpensesInput, calculateFIRE);
    setupBidirectionalSync(investmentReturnInput, investmentReturnNum, calculateFIRE, true);
    setupBidirectionalSync(swrInput, swrNum, calculateFIRE, true);

    // Cross-input constraint logic applied only on blur (e.g. Target Retire Age must be >= Current Age)
    currentAgeNum.addEventListener('blur', enforceAgeConstraints);
    targetAgeNum.addEventListener('blur', enforceAgeConstraints);

    function enforceAgeConstraints() {
        const currentAgeVal = parseInt(currentAgeNum.value.replace(/,/g, '')) || 18;
        let targetAgeVal = parseInt(targetAgeNum.value.replace(/,/g, '')) || 60;
        
        if (targetAgeVal < currentAgeVal) {
            targetAgeVal = currentAgeVal;
            targetAgeNum.value = formatNumberWithCommas(targetAgeVal);
            targetAgeInput.value = targetAgeVal;
            calculateFIRE();
            saveToStorage();
        }
    }

    // Theme Toggle implementation
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('color-scheme', newTheme);
        
        // Re-render chart with new theme colors
        setTimeout(updateChartTheme, 50);
    });

    // ── Gamification Engine ──

    // 1. Number Animation
    const activeAnimations = new Map();
    function animateValue(element, targetValue, formatFn) {
        if (!element) return;
        const now = performance.now();
        const duration = 400; // ms

        // Parse starting value from current text
        let startVal = parseFloat(element.textContent.replace(/[^\d.-]/g, ''));
        if (isNaN(startVal)) startVal = 0;

        if (activeAnimations.has(element)) {
            cancelAnimationFrame(activeAnimations.get(element).req);
        }

        if (startVal === targetValue) {
            element.textContent = formatFn(targetValue);
            return;
        }

        const anim = { startTime: now, startValue: startVal, endValue: targetValue, formatFn };

        const step = (currentTime) => {
            const elapsed = currentTime - anim.startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = anim.startValue + (anim.endValue - anim.startValue) * easeProgress;
            
            element.textContent = anim.formatFn(currentVal);

            if (progress < 1) {
                anim.req = requestAnimationFrame(step);
            } else {
                element.textContent = anim.formatFn(anim.endValue);
                activeAnimations.delete(element);
            }
        };

        anim.req = requestAnimationFrame(step);
        activeAnimations.set(element, anim);
    }

    function cancelAnimation(element) {
        if (activeAnimations.has(element)) {
            cancelAnimationFrame(activeAnimations.get(element).req);
            activeAnimations.delete(element);
        }
    }

    // 2. Confetti Engine (Lightweight Canvas)
    let hasCelebrated = false;
    let confettiParticles = [];
    let confettiAnimationId = null;

    function fireConfetti() {
        if (hasCelebrated) return;
        hasCelebrated = true;

        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = [
            getCssVar('--theme-color'),
            '#ffffff',
            'rgba(255,255,255,0.5)'
        ];

        const achievedCard = document.getElementById('achieved-card');
        let spawnX = canvas.width / 2;
        let spawnY = canvas.height / 2;
        if (achievedCard) {
            const rect = achievedCard.getBoundingClientRect();
            // Convert viewport coordinates to canvas coordinates (taking scroll into account)
            spawnX = rect.left + rect.width / 2 + window.scrollX;
            spawnY = rect.top + rect.height / 2 + window.scrollY;
        }

        confettiParticles = [];
        for (let i = 0; i < 100; i++) {
            confettiParticles.push({
                x: spawnX,
                y: spawnY,
                r: Math.random() * 6 + 2,
                dx: Math.random() * 14 - 7,
                dy: Math.random() * -12 - 4, // slightly less upward velocity since card is higher up
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            confettiParticles.forEach(p => {
                p.tiltAngle += p.tiltAngleIncrement;
                p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
                p.x += Math.sin(p.tiltAngle) * 2 + p.dx;
                p.dy += 0.1; // gravity
                p.y += p.dy;

                if (p.y <= canvas.height) active = true;

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
                ctx.stroke();
            });

            if (active) {
                confettiAnimationId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        cancelAnimationFrame(confettiAnimationId);
        render();
    }

    function resetCelebration() {
        hasCelebrated = false;
        const achievedCard = document.getElementById('achieved-card');
        if (achievedCard) achievedCard.classList.remove('card-achieved');
    }

    // Core FIRE Calculation Logic
    function calculateFIRE() {
        const currentAge = parseInt(currentAgeNum.value.replace(/,/g, '')) || 18;
        // In the calculation model, cap the target retirement age at minimum currentAge to ensure safe chart projection
        const targetAge = Math.max(currentAge, parseInt(targetAgeNum.value.replace(/,/g, '')) || 60);
        const netWorth = parseFloat(netWorthInput.value.replace(/,/g, '')) || 0;
        const annualSavings = parseFloat(annualSavingsInput.value.replace(/,/g, '')) || 0;
        const annualExpenses = parseFloat(annualExpensesInput.value.replace(/,/g, '')) || 0;
        const rate = (parseFloat(investmentReturnNum.value.replace(/,/g, '')) || 0) / 100;
        const swr = (parseFloat(swrNum.value.replace(/,/g, '')) || 4) / 100;

        // 1. Calculate FIRE Target Number
        const fireTarget = annualExpenses / swr;
        
        const currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });

        animateValue(fireNumberOutput, fireTarget, (val) => currencyFormatter.format(val));

        // 2. Project wealth year by year
        const labels = [];
        const netWorthData = [];
        const targetData = [];

        let currentSavings = netWorth;
        let fireAge = -1;
        let wealthAtTargetAge = netWorth;

        // Project until age 85 or for 40 years, whichever is longer
        const maxAge = Math.max(85, currentAge + 40);
        
        for (let age = currentAge; age <= maxAge; age++) {
            labels.push(`Age ${age}`);
            netWorthData.push(Math.round(currentSavings));
            targetData.push(Math.round(fireTarget));

            if (age === targetAge) {
                wealthAtTargetAge = currentSavings;
            }

            if (currentSavings >= fireTarget && fireAge === -1) {
                fireAge = age;
            }

            // Calculate next year's compound balance
            currentSavings = (currentSavings + annualSavings) * (1 + rate);
        }

        // 3. Update Metric Display Cards
        let displayYears = 0;
        const achievedCardHeader = document.querySelector('#achieved-card h3');

        if (fireAge !== -1) {
            const yearsToFire = fireAge - currentAge;
            displayYears = yearsToFire;
            
            if (yearsToFire === 0) {
                if (achievedCardHeader) achievedCardHeader.textContent = "Congrats";
                cancelAnimation(fireTimeOutput);
                fireTimeOutput.textContent = "Achieved!";
                fireStatusOutput.textContent = `FIRE achieved at age ${currentAge}`;
            } else {
                if (achievedCardHeader) achievedCardHeader.textContent = "Target Achieved In";
                animateValue(fireTimeOutput, yearsToFire, (val) => {
                    const rounded = Math.round(val);
                    return `${rounded} ${rounded === 1 ? 'Year' : 'Years'}`;
                });
                fireStatusOutput.textContent = `At age ${fireAge}`;
            }
        } else {
            if (achievedCardHeader) achievedCardHeader.textContent = "Target Achieved In";
            cancelAnimation(fireTimeOutput);
            fireTimeOutput.textContent = "50+ Years";
            fireStatusOutput.textContent = "Increase savings or return rate";
        }

        animateValue(retireValueOutput, wealthAtTargetAge, (val) => currencyFormatter.format(val));
        retireValueDescOutput.textContent = `At target age ${targetAge}`;

        // Gamification: Progress Ring & Confetti
        const progressCircle = document.getElementById('fire-progress-circle');
        if (progressCircle) {
            // Circle circumference is ~151
            const circumference = 151;
            let percent = 0;
            if (fireTarget > 0) {
                percent = Math.max(0, Math.min(100, (netWorth / fireTarget) * 100));
            }
            const offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        if (fireAge !== -1 && (fireAge - currentAge) === 0) {
            fireConfetti();
            const achievedCard = document.getElementById('achieved-card');
            if (achievedCard) achievedCard.classList.add('card-achieved');
        } else {
            resetCelebration();
        }

        // 4. Update the Projection Chart
        renderChart(labels, netWorthData, targetData);
    }

    // Chart.js Rendering Function
    function renderChart(labels, netWorthData, targetData) {
        const chartCanvas = document.getElementById('projectionChart');
        if (!chartCanvas) return;
        const ctx = chartCanvas.getContext('2d');
        
        const gridColor = getCssVar('--border-glass') || 'rgba(255, 255, 255, 0.08)';
        const textColor = getCssVar('--text-secondary') || '#8e8e93';
        const pathColor = (FIRE_PATHS[activePath] || FIRE_PATHS.traditional).color;
        const pathGradientColor = (FIRE_PATHS[activePath] || FIRE_PATHS.traditional).gradientColor;
        const colorEmerald = getCssVar('--color-emerald') || '#30d158';

        if (projectionChart) {
            projectionChart.data.labels = labels;
            projectionChart.data.datasets[0].data = netWorthData;
            projectionChart.data.datasets[1].data = targetData;
            
            // Sync theme configuration in case colors changed
            projectionChart.options.scales.x.grid.color = gridColor;
            projectionChart.options.scales.x.ticks.color = textColor;
            projectionChart.options.scales.y.grid.color = gridColor;
            projectionChart.options.scales.y.ticks.color = textColor;
            // Don't override chart line color here — selectPath manages it
            projectionChart.data.datasets[1].borderColor = colorEmerald;

            projectionChart.update('none'); // Update without default animation for high performance slider response
        } else {
            projectionChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Projected Wealth',
                            data: netWorthData,
                            borderColor: pathColor,
                            borderWidth: 3,
                            fill: true,
                            backgroundColor: (() => {
                                const g = ctx.createLinearGradient(0, 0, 0, 350);
                                g.addColorStop(0, pathGradientColor);
                                g.addColorStop(1, 'rgba(0,0,0,0)');
                                return g;
                            })(),
                            tension: 0.3,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: pathColor,
                            pointHoverBorderColor: '#ffffff',
                            pointHoverBorderWidth: 2,
                            pointHitRadius: 20
                        },
                        {
                            label: 'FIRE Target',
                            data: targetData,
                            borderColor: colorEmerald,
                            borderWidth: 2,
                            borderDash: [6, 6],
                            fill: false,
                            tension: 0,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            pointHitRadius: 20
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'nearest',
                        intersect: true,
                        axis: 'x'
                    },
                    plugins: {
                        legend: {
                            display: false // Using custom legends in HTML
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 15, 25, 0.9)',
                            titleFont: {
                                family: 'Outfit',
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                family: 'Plus Jakarta Sans',
                                size: 13
                            },
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            boxPadding: 8,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.parsed.y);
                                    }
                                    return label;
                                },
                                afterLabel: function(context) {
                                    if (context.dataset.label === 'Projected Wealth' && context.parsed.y > 0) {
                                        const swrPercent = parseFloat(swrNum.value) || 4;
                                        const swrDecimal = swrPercent / 100;
                                        const annualAllowance = context.parsed.y * swrDecimal;
                                        const monthlyAllowance = annualAllowance / 12;
                                        
                                        const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
                                        
                                        return [
                                            `  • Annual (${swrPercent}%): ${formatCurrency(annualAllowance)}`,
                                            `  • Monthly: ${formatCurrency(monthlyAllowance)}`
                                        ];
                                    }
                                    return null;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: gridColor,
                                drawBorder: false
                            },
                            ticks: {
                                color: textColor,
                                font: {
                                    family: 'Plus Jakarta Sans',
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: gridColor,
                                drawBorder: false
                            },
                            ticks: {
                                color: textColor,
                                font: {
                                    family: 'Plus Jakarta Sans',
                                    size: 11
                                },
                                callback: function(value) {
                                    if (value >= 1e6) {
                                        return '$' + (value / 1e6).toFixed(1) + 'M';
                                    } else if (value >= 1e3) {
                                        return '$' + (value / 1e3).toFixed(0) + 'k';
                                    }
                                    return '$' + value;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Helper to create glowing background area under line chart
    function createGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 350);
        let rgbaColorStart = 'rgba(94, 92, 230, 0.15)';
        if (color.includes('hsl')) {
            rgbaColorStart = color.replace('hsl', 'hsla').replace(')', ', 0.15)');
        } else if (color.startsWith('#')) {
            rgbaColorStart = color === '#30d158' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(94, 92, 230, 0.15)';
        }
        
        gradient.addColorStop(0, rgbaColorStart);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        return gradient;
    }

    // Sync theme updates on the chart labels
    function updateChartTheme() {
        if (!projectionChart) return;
        const gridColor = getCssVar('--border-glass') || 'rgba(255, 255, 255, 0.08)';
        const textColor = getCssVar('--text-secondary') || '#8e8e93';
        const colorIndigo = getCssVar('--color-indigo') || '#5e5ce6';
        const colorEmerald = getCssVar('--color-emerald') || '#30d158';
        const ctx = document.getElementById('projectionChart').getContext('2d');

        projectionChart.options.scales.x.grid.color = gridColor;
        projectionChart.options.scales.x.ticks.color = textColor;
        projectionChart.options.scales.y.grid.color = gridColor;
        projectionChart.options.scales.y.ticks.color = textColor;
        projectionChart.data.datasets[0].borderColor = colorIndigo;
        projectionChart.data.datasets[0].pointHoverBackgroundColor = colorIndigo;
        projectionChart.data.datasets[0].backgroundColor = createGradient(ctx, colorIndigo);
        projectionChart.data.datasets[1].borderColor = colorEmerald;
        
        projectionChart.update();
    }

    // Fetch Expat Countries Data
    let expatCountriesData = [];
    const FALLBACK_COUNTRIES = [
        { country: "Portugal", country_code: "PT", monthly_estimate_usd: 2000 },
        { country: "Spain", country_code: "ES", monthly_estimate_usd: 2200 },
        { country: "Costa Rica", country_code: "CR", monthly_estimate_usd: 1700 },
        { country: "Mexico", country_code: "MX", monthly_estimate_usd: 1500 },
        { country: "Thailand", country_code: "TH", monthly_estimate_usd: 1200 },
        { country: "Colombia", country_code: "CO", monthly_estimate_usd: 1100 },
        { country: "Panama", country_code: "PA", monthly_estimate_usd: 1800 },
        { country: "Vietnam", country_code: "VN", monthly_estimate_usd: 1000 },
        { country: "Indonesia", country_code: "ID", monthly_estimate_usd: 1200 },
        { country: "Greece", country_code: "GR", monthly_estimate_usd: 1900 },
        { country: "Italy", country_code: "IT", monthly_estimate_usd: 2300 },
        { country: "Malaysia", country_code: "MY", monthly_estimate_usd: 1300 },
        { country: "Philippines", country_code: "PH", monthly_estimate_usd: 1100 },
        { country: "Ecuador", country_code: "EC", monthly_estimate_usd: 1200 },
        { country: "Czech Republic", country_code: "CZ", monthly_estimate_usd: 1800 }
    ];

    function fetchExpatCountries() {
        if (!expatCountrySelect) return;
        
        expatCountrySelect.innerHTML = '<option value="" disabled selected>Loading countries...</option>';
        
        fetch('https://getwherenext.com/api/data/cost-of-living')
            .then(res => {
                if (!res.ok) throw new Error("HTTP error " + res.status);
                return res.json();
            })
            .then(data => {
                expatCountriesData = data;
                populateExpatDropdown();
            })
            .catch(err => {
                console.warn("Error fetching expat cost of living (using offline fallback):", err);
                // Load fallback list instead of showing error
                expatCountriesData = FALLBACK_COUNTRIES;
                populateExpatDropdown();
                
                // Show a brief fallback note in place of error
                if (expatCostNote) {
                    expatCostNote.textContent = "Offline mode: loaded popular retirement destinations.";
                    expatCostNote.style.color = "var(--text-muted)";
                }
            });
    }

    function populateExpatDropdown() {
        if (!expatCountrySelect) return;
        expatCountrySelect.innerHTML = '<option value="" disabled selected>Select a country...</option>';
        
        // Sort countries alphabetically
        const sorted = [...expatCountriesData].sort((a, b) => a.country.localeCompare(b.country));
        
        sorted.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.country_code;
            opt.textContent = `${c.country} ($${c.monthly_estimate_usd}/mo)`;
            expatCountrySelect.appendChild(opt);
        });
        
        // Try restoring saved expat country selection if exists
        const savedCountry = localStorage.getItem('fire_expat_country');
        if (savedCountry) {
            expatCountrySelect.value = savedCountry;
            const country = expatCountriesData.find(c => c.country_code === savedCountry);
            if (country && expatCostNote) {
                const annual = country.monthly_estimate_usd * 12;
                expatCostNote.style.color = "";
                expatCostNote.textContent = `Average expat living cost in ${country.country}: $${formatNumberWithCommas(country.monthly_estimate_usd)}/mo ($${formatNumberWithCommas(annual)}/yr)`;
            }
        }
    }

    // Handle Expat Country Selection Change
    if (expatCountrySelect) {
        expatCountrySelect.addEventListener('change', () => {
            const countryCode = expatCountrySelect.value;
            const country = expatCountriesData.find(c => c.country_code === countryCode);
            if (country) {
                const annualExpenses = country.monthly_estimate_usd * 12;
                
                // Update inputs
                annualExpensesInput.value = formatNumberWithCommas(annualExpenses);
                annualExpensesSlider.value = annualExpenses;
                
                // Show cost note
                if (expatCostNote) {
                    expatCostNote.style.color = "";
                    expatCostNote.textContent = `Average expat living cost in ${country.country}: $${formatNumberWithCommas(country.monthly_estimate_usd)}/mo ($${formatNumberWithCommas(annualExpenses)}/yr)`;
                }
                
                localStorage.setItem('fire_expat_country', countryCode);
                
                calculateFIRE();
                saveToStorage();
            }
        });
    }

    // Load inputs from local storage, restore selected path, then calculate
    loadFromStorage();
    const savedPath = localStorage.getItem('fire_activePath') || 'traditional';
    // Restore path chip highlight + panel border (without overwriting user's saved field values)
    selectPath(savedPath, false);
    calculateFIRE();
    
    // Fetch expat countries
    fetchExpatCountries();
});
