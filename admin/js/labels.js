// Scope Tracking Variables for Transaction Adjustments
let activeModalMode = "DEDUCT"; 
let modalCurrentFullBoxesSnapshot = 0;
let modalCurrentLooseLabelsSnapshot = 0;

/**
 * Enhanced Modal Initialization Controller Engine
 */
window.openUpdateModal = function(partCode, supplierId, supplierName, currentBoxes, currentLoose, effectiveQtyPerBox) {
    // 1. Assign Local Operational Memory State Fields
    document.getElementById("modal-part-code").value = partCode;
    document.getElementById("modal-supplier-id").value = supplierId;
    document.getElementById("modal-supplier-name").value = supplierName;
    document.getElementById("modal-qty-per-box").value = effectiveQtyPerBox;
    
    modalCurrentFullBoxesSnapshot = currentBoxes;
    modalCurrentLooseLabelsSnapshot = currentLoose;
    
    const currentTotalLabels = (currentBoxes * effectiveQtyPerBox) + currentLoose;
    
    // 2. Refresh Static Target Presentation Labels
    document.getElementById("modal-box-qty-badge").textContent = effectiveQtyPerBox.toLocaleString();
    document.getElementById("modal-current-bal-badge").textContent = currentTotalLabels.toLocaleString();
    
    // 3. Evaluate Profile Permissions to Filter Tab Layout Access Options
    const userRoleId = currentUser.profile?.role_id; // 1 = Admin, 2 = Staff, 3 = Operator
    const addModeBtn = document.getElementById("btn-mode-add");
    const correctModeBtn = document.getElementById("btn-mode-correct");
    
    if (userRoleId === 1 || userRoleId === 2) {
        if (addModeBtn) addModeBtn.style.display = "block";
        if (correctModeBtn) correctModeBtn.style.display = "block";
    } else {
        if (addModeBtn) addModeBtn.style.display = "none";
        if (correctModeBtn) correctModeBtn.style.display = "none";
    }

    // 4. Force default initialization straight to the Operator DEDUCT mode
    switchInventoryModalMode("DEDUCT");
    document.getElementById("customUpdateModalContainer").style.display = "block";
};

/**
 * Handles Tab-switching mechanics to visually restyle layout configurations dynamically
 */
window.switchInventoryModalMode = function(targetMode) {
    activeModalMode = targetMode;
    
    const header = document.getElementById("modal-header-accent");
    const submitBtn = document.getElementById("submit-count-btn");
    const shortcutBlock = document.getElementById("operator-shortcut-block");
    const partCode = document.getElementById("modal-part-code").value;
    const supplierName = document.getElementById("modal-supplier-name").value;
    
    // Reset all context selector buttons to passive design colors
    ["btn-mode-deduct", "btn-mode-add", "btn-mode-correct"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.background = "#f1f5f9";
            btn.style.color = "#1e293b";
            btn.style.borderColor = "#cbd5e1";
        }
    });

    // Clear operational inputs to prevent carrying values between modes
    document.getElementById("input-full-boxes").value = 0;
    document.getElementById("input-loose-labels").value = 0;

    // Apply specific color configurations based on active processing rules
    if (targetMode === "DEDUCT") {
        document.getElementById("btn-mode-deduct").style.background = "#eff6ff";
        document.getElementById("btn-mode-deduct").style.color = "#1e40af";
        document.getElementById("btn-mode-deduct").style.borderColor = "#2563eb";
        
        header.style.background = "#2563eb";
        submitBtn.style.background = "#2563eb";
        submitBtn.textContent = "Submit Operational Production Deduction";
        if (shortcutBlock) shortcutBlock.style.display = "block";
        
        document.getElementById("modal-title-text").textContent = `Deduct Usage Logs: Run ${partCode} (${supplierName})`;
        document.getElementById("label-full-boxes").textContent = "How many FULL boxes did you completely USE?";
        document.getElementById("label-loose-labels").textContent = "How many LOOSE labels were consumed from the open box?";
        
    } else if (targetMode === "ADD") {
        document.getElementById("btn-mode-add").style.background = "#ecfdf5";
        document.getElementById("btn-mode-add").style.color = "#065f46";
        document.getElementById("btn-mode-add").style.borderColor = "#059669";
        
        header.style.background = "#059669";
        submitBtn.style.background = "#059669";
        submitBtn.textContent = "Receive Incoming Stock Allocation";
        if (shortcutBlock) shortcutBlock.style.display = "none";
        
        document.getElementById("modal-title-text").textContent = `New Shipment Arrival: Run ${partCode} (${supplierName})`;
        document.getElementById("label-full-boxes").textContent = "How many NEW full boxes arrived?";
        document.getElementById("label-loose-labels").textContent = "How many EXTRA loose labels arrived?";
        
    } else if (targetMode === "CORRECT") {
        document.getElementById("btn-mode-correct").style.background = "#fef2f2";
        document.getElementById("btn-mode-correct").style.color = "#991b1b";
        document.getElementById("btn-mode-correct").style.borderColor = "#ef4444";
        
        header.style.background = "#dc2626";
        submitBtn.style.background = "#dc2626";
        submitBtn.textContent = "⚠️ OVERWRITE & CORRECT INVENTORY";
        if (shortcutBlock) shortcutBlock.style.display = "none";
        
        // Match old values for convenience in correction mode
        document.getElementById("input-full-boxes").value = modalCurrentFullBoxesSnapshot;
        document.getElementById("input-loose-labels").value = modalCurrentLooseLabelsSnapshot;
        
        document.getElementById("modal-title-text").textContent = `Absolute Count Correction: Run ${partCode} (${supplierName})`;
        document.getElementById("label-full-boxes").textContent = "Correct Count: Actual FULL boxes on pallet:";
        document.getElementById("label-loose-labels").textContent = "Correct Count: Actual LOOSE pieces inside open box:";
    }

    calculateLiveMathConfirmation();
};

/**
 * Calculates and outputs a live structural math verification directly to the view field
 */
window.calculateLiveMathConfirmation = function() {
    const qtyPerBox = parseInt(document.getElementById("modal-qty-per-box").value) || 6000;
    const inputBoxes = parseInt(document.getElementById("input-full-boxes").value) || 0;
    const inputLoose = parseInt(document.getElementById("input-loose-labels").value) || 0;
    
    const initialTotal = (modalCurrentFullBoxesSnapshot * qtyPerBox) + modalCurrentLooseLabelsSnapshot;
    const inputTransactionTotal = (inputBoxes * qtyPerBox) + inputLoose;
    
    let finalTotalSumLabels = initialTotal;
    
    const banner = document.getElementById("live-math-banner");
    if (!banner) return;

    if (activeModalMode === "DEDUCT") {
        finalTotalSumLabels = initialTotal - inputTransactionTotal;
        banner.style.background = "#eff6ff";
        banner.style.borderColor = "#bfdbfe";
        banner.style.color = "#1e40af";
        
        if (finalTotalSumLabels < 0) {
            banner.innerHTML = `⚠️ Calculation Alert: Deduction exceeds total stock! System balance will floor at 0 labels.`;
            return;
        }
        banner.innerHTML = `📊 Logic Track: ${initialTotal.toLocaleString()} (Current) - ${inputTransactionTotal.toLocaleString()} (Used) = Final Database Balance: <strong>${finalTotalSumLabels.toLocaleString()} labels</strong>`;
        
    } else if (activeModalMode === "ADD") {
        finalTotalSumLabels = initialTotal + inputTransactionTotal;
        banner.style.background = "#ecfdf5";
        banner.style.borderColor = "#a7f3d0";
        banner.style.color = "#065f46";
        banner.innerHTML = `📊 Logic Track: ${initialTotal.toLocaleString()} (Current) + ${inputTransactionTotal.toLocaleString()} (New Arrival) = Final Database Balance: <strong>${finalTotalSumLabels.toLocaleString()} labels</strong>`;
        
    } else if (activeModalMode === "CORRECT") {
        finalTotalSumLabels = inputTransactionTotal;
        banner.style.background = "#fff1f2";
        banner.style.borderColor = "#fecdd3";
        banner.style.color = "#991b1b";
        banner.innerHTML = `⚠️ OVERWRITE RULE ACTIVE: Wiping old balance. Database will force override directly to: <strong>${finalTotalSumLabels.toLocaleString()} labels</strong>`;
    }
};

/**
 * Shortcuts to optimize processing speeds for production operators
 */
window.applyBoxLeftShortcut = function() {
    document.getElementById("input-full-boxes").value = 0;
    document.getElementById("input-loose-labels").value = 500;
    calculateLiveMathConfirmation();
};

window.applyShiftEndShortcut = function() {
    document.getElementById("input-full-boxes").value = 0;
    document.getElementById("input-loose-labels").value = 0;
    calculateLiveMathConfirmation();
};

/**
 * Close modal utilities
 */
window.closeCustomModal = function() {
    document.getElementById("customUpdateModalContainer").style.display = "none";
};

/**
 * Safe Form Submit Interceptor Listener Binding and Initialization Function
 */
function initializeInventoryFormListener() {
    const formElement = document.getElementById("stock-update-form");
    
    // If the form element doesn't exist on this current page/view, exit cleanly without throwing errors
    if (!formElement) return;

    formElement.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById("submit-count-btn");
        if (!submitBtn || submitBtn.disabled) return; 

        submitBtn.disabled = true;
        const oldBtnText = submitBtn.textContent;
        submitBtn.textContent = "Processing Transaction...";

        const partCode = document.getElementById("modal-part-code").value;
        const supplierId = parseInt(document.getElementById("modal-supplier-id").value);
        const supplierName = document.getElementById("modal-supplier-name").value;
        const qtyPerBox = parseInt(document.getElementById("modal-qty-per-box").value) || 6000;
        
        const inputBoxes = parseInt(document.getElementById("input-full-boxes").value) || 0;
        const inputLoose = parseInt(document.getElementById("input-loose-labels").value) || 0;
        const inputTransactionTotal = (inputBoxes * qtyPerBox) + inputLoose;

        let finalBoxesTarget = inputBoxes;
        let finalLooseTarget = inputLoose;

        if (activeModalMode === "DEDUCT") {
            const currentTotal = (modalCurrentFullBoxesSnapshot * qtyPerBox) + modalCurrentLooseLabelsSnapshot;
            let newTotal = currentTotal - inputTransactionTotal;
            if (newTotal < 0) newTotal = 0;
            
            finalBoxesTarget = Math.floor(newTotal / qtyPerBox);
            finalLooseTarget = newTotal % qtyPerBox;
            
        } else if (activeModalMode === "ADD") {
            const currentTotal = (modalCurrentFullBoxesSnapshot * qtyPerBox) + modalCurrentLooseLabelsSnapshot;
            const newTotal = currentTotal + inputTransactionTotal;
            
            finalBoxesTarget = Math.floor(newTotal / qtyPerBox);
            finalLooseTarget = newTotal % qtyPerBox;
        }

        const calculatedGrandTotalSum = (finalBoxesTarget * qtyPerBox) + finalLooseTarget;

        try {
            const { error: upsertError } = await supabaseClient
                .from("labels_inventory")
                .upsert({
                    part_code: partCode,
                    supplier_id: supplierId,
                    current_full_boxes: finalBoxesTarget,
                    current_loose_labels: finalLooseTarget,
                    qty_per_box: qtyPerBox 
                }, { onConflict: 'part_code, supplier_id' });

            if (upsertError) throw upsertError;

            await supabaseClient.from("activity_log").insert({
                user_id: currentUser?.id || null,
                username: currentUser?.profile?.username || "floor_user",
                module: "labels",
                action: `update_stock_${activeModalMode.toLowerCase()}`,
                details: {
                    part_code: partCode,
                    supplier: supplierName,
                    mode_executed: activeModalMode,
                    input_boxes: inputBoxes,
                    input_loose: inputLoose,
                    database_final_boxes: finalBoxesTarget,
                    database_final_loose: finalLooseTarget,
                    calculated_total_balance: calculatedGrandTotalSum
                }
            });

            closeCustomModal();
            if (typeof loadInventoryForPartCode === "function") await loadInventoryForPartCode(partCode);
            if (typeof buildGlobalInventoryCacheSnapshot === "function") await buildGlobalInventoryCacheSnapshot();

        } catch (err) {
            console.error("Transaction failed:", err);
            alert(`Storage Rejection Error: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = oldBtnText;
        }
    });
}

// Intercept execution and wait until DOM elements are fully loaded before binding events
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeInventoryFormListener);
} else {
    initializeInventoryFormListener();
}
