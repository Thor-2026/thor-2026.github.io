// ===============================================
// THOR DISPLAY CMS - PACKAGING LOGIC MATRIX 
// Label Inventory Management Script Controller
// ===============================================

let masterSuppliersList = [];
let selectedPartCodeData = [];

/**
 * Main Initialization Lifecycle Module Router Hook
 */
async function initLabelsPage() {
    console.log("Initializing Gated Labels Inventory Controller System...");
    
    // Evaluate if the logged-in personnel holds access permissions
    const userHasAccess = evaluateLabelUpdatePermissions();
    
    if (!userHasAccess) {
        document.getElementById("authorized-view-wrapper").style.display = "none";
        document.getElementById("unauthorized-barrier-wrapper").style.display = "block";
        return;
    }

    // Is clear, show form layout management fields
    document.getElementById("unauthorized-barrier-wrapper").style.display = "none";
    document.getElementById("authorized-view-wrapper").style.display = "block";

    // 1. Establish Authentication View Modes Layout Elements
    renderAuthStatusArea();

    // 2. Fetch Base Structural Lookup Tables from Supabase
    await refreshSuppliersList();

    // 3. Refresh Catalog Matrix and Dropdown Layouts
    await refreshPartCodesCatalogDropdown();

    // 4. Bind Reactive UI Dynamic Click & Change Receivers
    bindLabelEventHandlers();
}

/**
 * Validates active session metadata credentials against required permission scopes
 */
function evaluateLabelUpdatePermissions() {
    // Fallback security check: if entirely logged out, bar modification completely
    if (!currentUser) return false;

    // 1. Check if user schema maps an explicit permission flag
    if (currentUser.permissions && typeof currentUser.permissions.can_manage_labels !== 'undefined') {
        return currentUser.permissions.can_manage_labels === true;
    }

    // 2. Fallback check by Role IDs (e.g., Role 1 = Super Admin, Role 3 = Operator)
    // If your operators are authorized to count and save balances at run completion, allow 1 and 3.
    const userRoleId = currentUser.profile?.role_id;
    if (userRoleId === 1 || userRoleId === 3) {
        return true;
    }

    return false;
}

/**
 * Renders Contextual Authentication Headers and Toggles Administration Panel visibility
 */
function renderAuthStatusArea() {
    const container = document.getElementById("auth-status-area");
    const adminPanel = document.getElementById("catalog-management-row");
    if (!container) return;

    const currentShift = currentUser.profile?.shift || "Unassigned Shift";
    const displayName = currentUser.profile?.full_name || currentUser.profile?.username || "Staff";
    
    let roleText = "Staff";
    const userRoleId = currentUser.profile?.role_id;
    if (userRoleId === 1) roleText = "Super Admin";
    if (userRoleId === 3) roleText = "Operator";
    
    container.innerHTML = `
        <div class="inv-badge" style="background:#ffffff; border:2px solid #cbd5e1; padding:8px 14px; border-radius:6px; text-align:right;">
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">👤 ${displayName}</div>
            <div style="font-size: 11px; font-weight:600; color: #64748b; margin-top: 1px;">${roleText.toUpperCase()} • ${currentShift}</div>
        </div>
    `;
    
    // Only reveal core part code creation/deletion catalog metrics if profile is high-clearance Admin (Role 1)
    if (userRoleId === 1) {
        if (adminPanel) adminPanel.style.display = "block";
    } else {
        if (adminPanel) adminPanel.style.display = "none";
    }
}

/**
 * Loads and displays the available suppliers as structured config rows with explicit Qty settings
 */
async function refreshSuppliersList() {
    const data = await fetchAllSuppliers();
    if (data) {
        masterSuppliersList = data;
        renderSupplierCheckboxes();
    }
}

function renderSupplierCheckboxes() {
    const container = document.getElementById("catalog-supplier-checkboxes");
    if (!container) return;

    if (masterSuppliersList.length === 0) {
        container.innerHTML = `<span style="font-size:12px; color:#dc2626;">No suppliers in database</span>`;
        return;
    }

    container.innerHTML = "";
    masterSuppliersList.forEach(supplier => {
        const row = document.createElement("div");
        row.className = "supplier-config-row";
        row.innerHTML = `
            <label class="supplier-label-item">
                <input type="checkbox" name="catalog-suppliers" value="${supplier.id}" checked>
                <span>${supplier.supplier_name}</span>
            </label>
            <div>
                <span style="font-size:11px; font-weight:700; color:#64748b; margin-right:4px;">QTY / BOX:</span>
                <input type="number" class="supplier-box-qty-input" data-supplier-id="${supplier.id}" value="${supplier.qty_per_box}" placeholder="${supplier.qty_per_box}" min="0">
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * Administrative Feature: Adds a new supplier straight into the operational database
 */
window.promptCreateNewSupplier = async function() {
    if (currentUser.profile?.role_id !== 1) {
        alert("Action Revoked: Only System Administrators possess catalog design rights.");
        return;
    }

    const supplierName = prompt("Enter the name of the new label supplier line:\n(e.g., Prodigy, Northern, Apex Packaging)");
    if (!supplierName || !supplierName.trim()) return;

    const qtyText = prompt(`Enter standard fallback label quantity packed inside one full box for ${supplierName.trim()}:`, "15000");
    if (qtyText === null) return;
    const qtyPerBox = parseInt(qtyText) || 15000;

    try {
        const { error: insertError } = await supabaseClient
            .from("suppliers")
            .insert({ supplier_name: supplierName.trim(), qty_per_box: qtyPerBox });

        if (insertError) throw insertError;

        alert(`Supplier "${supplierName.trim()}" successfully recorded!`);
        await refreshSuppliersList();
        
        const currentCode = document.getElementById("part-code-selector").value;
        if (currentCode) {
            await loadInventoryForPartCode(currentCode);
        }
    } catch (err) {
        console.error("Failed to add supplier:", err);
        alert(`Database Error: ${err.message}`);
    }
};

/**
 * Pulls and Refreshes Core Dropdown Indexes directly from the Supabase tables
 */
async function refreshPartCodesCatalogDropdown() {
    const loadedPartCodes = await fetchAllPartCodes();
    if (loadedPartCodes) {
        populatePartCodeDropdown(loadedPartCodes);
    }
}

async function fetchAllSuppliers() {
    const { data, error } = await supabaseClient
        .from("suppliers")
        .select("*")
        .order("supplier_name", { ascending: true });

    if (error) {
        console.error("Error retrieving supplier indexes:", error);
        return null;
    }
    return data;
}

async function fetchAllPartCodes() {
    const { data, error } = await supabaseClient
        .from("part_codes")
        .select("*")
        .order("part_code", { ascending: true });

    if (error) {
        console.error("Error retrieving part catalog rows:", error);
        return null;
    }
    return data;
}

function populatePartCodeDropdown(partCodes) {
    const selector = document.getElementById("part-code-selector");
    if (!selector) return;

    if (partCodes.length === 0) {
        selector.innerHTML = '<option value="">-- No Part Codes Configured in System --</option>';
        return;
    }

    selector.innerHTML = '<option value="">-- Choose an Active Label Part Code --</option>';
    partCodes.forEach(item => {
        const option = document.createElement("option");
        option.value = item.part_code;
        option.textContent = `${item.part_code} - ${item.label_name}`;
        selector.appendChild(option);
    });
}

function bindLabelEventHandlers() {
    const selector = document.getElementById("part-code-selector");
    if (selector) {
        selector.addEventListener("change", async (e) => {
            const selectedCode = e.target.value;
            if (!selectedCode) {
                document.getElementById("inventory-display-root").style.display = "none";
                return;
            }
            await loadInventoryForPartCode(selectedCode);
        });
    }

    const form = document.getElementById("stock-update-form");
    if (form) {
        form.removeEventListener("submit", handleStockSubmit); 
        form.addEventListener("submit", handleStockSubmit);
    }
}

/**
 * Pulls, Concat-Maps, and Displays Complete Multi-Supplier Inventory State Matrix Records
 */
async function loadInventoryForPartCode(partCode) {
    const rootContainer = document.getElementById("inventory-display-root");
    const labelTitle = document.getElementById("display-label-name");
    const tableBody = document.getElementById("inventory-table-body");
    
    if (!rootContainer || !labelTitle || !tableBody) return;
    
    const canModify = evaluateLabelUpdatePermissions();

    document.getElementById("table-action-header").style.display = canModify ? "" : "none";
    document.getElementById("table-action-footer").style.display = canModify ? "" : "none";

    const selector = document.getElementById("part-code-selector");
    if (selector.selectedIndex <= 0) return;
    
    const chosenText = selector.options[selector.selectedIndex].text;
    labelTitle.textContent = chosenText;

    const { data: inventoryRecords, error } = await supabaseClient
        .from("labels_inventory")
        .select("*")
        .eq("part_code", partCode);

    if (error) {
        console.error("Error retrieving count balances:", error);
        return;
    }

    selectedPartCodeData = inventoryRecords || [];
    tableBody.innerHTML = "";

    let grandTotalBoxes = 0;
    let grandTotalLoose = 0;
    let grandTotalLabels = 0;
    let minSetpointAlert = 5000; 

    const applicableSuppliers = masterSuppliersList.filter(s => 
        selectedPartCodeData.some(r => r.supplier_id === s.id)
    );

    const linesToRender = applicableSuppliers.length > 0 ? applicableSuppliers : masterSuppliersList;

    linesToRender.forEach(supplier => {
        const record = selectedPartCodeData.find(r => r.supplier_id === supplier.id) || {
            current_full_boxes: 0,
            current_loose_labels: 0,
            min_setpoint: 5000,
            qty_per_box: supplier.qty_per_box
        };

        const effectiveQtyPerBox = record.qty_per_box ? record.qty_per_box : supplier.qty_per_box;

        minSetpointAlert = record.min_setpoint; 
        const supplierSubtotal = (record.current_full_boxes * effectiveQtyPerBox) + record.current_loose_labels;

        grandTotalBoxes += record.current_full_boxes;
        grandTotalLoose += record.current_loose_labels;
        grandTotalLabels += supplierSubtotal;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 700; color: #0f172a;">${supplier.supplier_name}</td>
            <td style="text-align: center; font-weight: 600;">${record.current_full_boxes.toLocaleString()} Boxes</td>
            <td style="text-align: center; font-weight: 600;">${record.current_loose_labels.toLocaleString()} Labels</td>
            <td style="text-align: center; color: #475569; font-weight: 600;">${effectiveQtyPerBox.toLocaleString()} / box</td>
            <td style="text-align: center; font-weight: 800; color: #0f172a;">${supplierSubtotal.toLocaleString()}</td>
            ${canModify ? `
                <td style="text-align: right;">
                    <button type="button" class="inv-btn-edit" onclick="openUpdateModal('${partCode}', ${supplier.id}, '${supplier.supplier_name}', ${record.current_full_boxes}, ${record.current_loose_labels}, ${effectiveQtyPerBox})">
                        ✏️ Update Count
                    </button>
                </td>
            ` : '<td style="display:none;"></td>'}
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("grand-boxes-cell").textContent = `${grandTotalBoxes.toLocaleString()} Boxes`;
    document.getElementById("grand-loose-cell").textContent = `${grandTotalLoose.toLocaleString()} Loose`;
    document.getElementById("grand-labels-cell").textContent = `${grandTotalLabels.toLocaleString()} Labels`;

    const alertBanner = document.getElementById("low-stock-alert-banner");
    if (alertBanner) {
        if (grandTotalLabels <= minSetpointAlert) {
            alertBanner.style.display = "block";
        } else {
            alertBanner.style.display = "none";
        }
    }

    rootContainer.style.display = "block";
}

/**
 * ENGINEERING TOOL: Adds a Brand New 4-Digit Part Code and maps specific custom Qty / Box counts
 */
window.submitNewCatalogPartCode = async function() {
    if (currentUser.profile?.role_id !== 1) {
        alert("Unauthorized action execution barred.");
        return;
    }

    const codeInput = document.getElementById("new-part-code");
    const nameInput = document.getElementById("new-label-name");
    const minStockInput = document.getElementById("new-min-stock");
    
    if (!codeInput || !nameInput || !minStockInput) return;

    const partCode = codeInput.value.trim();
    const labelName = nameInput.value.trim();
    const parsedMinStock = parseInt(minStockInput.value);
    const minSetpoint = isNaN(parsedMinStock) ? 5000 : parsedMinStock;

    if (partCode.length !== 4 || isNaN(partCode)) {
        alert("Verification Error: Part Code must be exactly a 4-digit number.");
        return;
    }
    if (!labelName) {
        alert("Verification Error: Please provide a description title name.");
        return;
    }

    const checkedBoxes = document.querySelectorAll('input[name="catalog-suppliers"]:checked');
    if (checkedBoxes.length === 0) {
        alert("Selection Error: Please assign this Part Code to at least one Supplier Line.");
        return;
    }

    try {
        const { error: partError } = await supabaseClient
            .from("part_codes")
            .insert({ part_code: partCode, label_name: labelName });

        if (partError) throw partError;

        const initialRows = Array.from(checkedBoxes).map(box => {
            const suppId = parseInt(box.value);
            const qtyBoxInput = document.querySelector(`.supplier-box-qty-input[data-supplier-id="${suppId}"]`);
            
            let customQty = qtyBoxInput ? parseInt(qtyBoxInput.value) : 0;
            if (!customQty || isNaN(customQty)) {
                const matchedSupp = masterSuppliersList.find(s => s.id === suppId);
                customQty = matchedSupp ? matchedSupp.qty_per_box : 15000;
            }

            return {
                part_code: partCode,
                supplier_id: suppId,
                current_full_boxes: 0,
                current_loose_labels: 0,
                min_setpoint: minSetpoint,
                qty_per_box: customQty 
            };
        });

        const { error: invError } = await supabaseClient
            .from("labels_inventory")
            .insert(initialRows);

        if (invError) throw invError;

        await supabaseClient.from("activity_log").insert({
            user_id: currentUser?.id || null,
            username: currentUser?.profile?.username || "admin",
            module: "labels",
            action: "create_part_code",
            details: { part_code: partCode, label_name: labelName, suppliers: initialRows }
        });

        alert(`Success: Part code ${partCode} initialized perfectly.`);
        codeInput.value = "";
        nameInput.value = "";
        minStockInput.value = "5000"; 
        
        await refreshPartCodesCatalogDropdown();
        document.getElementById("part-code-selector").value = partCode;
        await loadInventoryForPartCode(partCode);

    } catch (err) {
        console.error("Critical failure during catalog insert:", err);
        alert(`Failed to save code. Custom Details: ${err.message}`);
    }
};

/**
 * ENGINEERING TOOL: Purges Selected Part Code records
 */
window.deleteCurrentSelectedPartCode = async function() {
    if (currentUser.profile?.role_id !== 1) {
        alert("Action Denied.");
        return;
    }

    const selector = document.getElementById("part-code-selector");
    if (!selector) return;
    
    const selectedCode = selector.value;
    if (!selectedCode) {
        alert("Selection Request: Please pick a part code from the selector dropdown menu first.");
        return;
    }

    const confirmPurge = confirm(`🛑 WARNING: Are you completely certain you wish to delete part code "${selectedCode}"?`);
    if (!confirmPurge) return;

    try {
        const { error: catalogPurgeError } = await supabaseClient
            .from("part_codes")
            .delete()
            .eq("part_code", selectedCode);

        if (catalogPurgeError) throw catalogPurgeError;

        alert(`Catalog Success: Part code ${selectedCode} successfully removed.`);
        document.getElementById("inventory-display-root").style.display = "none";
        await refreshPartCodesCatalogDropdown();

    } catch (err) {
        console.error("Critical cascade purge failure:", err);
        alert(`Failed to execute clear commands: ${err.message}`);
    }
};

window.openUpdateModal = function(partCode, supplierId, supplierName, currentBoxes, currentLoose, effectiveQtyPerBox) {
    document.getElementById("modal-part-code").value = partCode;
    document.getElementById("modal-supplier-id").value = supplierId;
    document.getElementById("modal-supplier-name").value = supplierName;
    document.getElementById("modal-qty-per-box").value = effectiveQtyPerBox;
    
    document.getElementById("modal-box-qty-badge").textContent = effectiveQtyPerBox.toLocaleString();
    document.getElementById("modal-title-text").textContent = `Update Run ${partCode} (${supplierName})`;
    
    document.getElementById("input-full-boxes").value = currentBoxes;
    document.getElementById("input-loose-labels").value = currentLoose;

    document.getElementById("customUpdateModalContainer").style.display = "block";
};

window.closeCustomModal = function() {
    document.getElementById("customUpdateModalContainer").style.display = "none";
};

async function handleStockSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("submit-count-btn");
    if (!submitBtn) return; 

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    const partCode = document.getElementById("modal-part-code").value;
    const supplierId = parseInt(document.getElementById("modal-supplier-id").value);
    const supplierName = document.getElementById("modal-supplier-name").value;
    const qtyPerBox = parseInt(document.getElementById("modal-qty-per-box").value) || 15000;
    
    const inputBoxes = parseInt(document.getElementById("input-full-boxes").value) || 0;
    const inputLoose = parseInt(document.getElementById("input-loose-labels").value) || 0;
    const calculatedTotal = (inputBoxes * qtyPerBox) + inputLoose;

    try {
        const { error: upsertError } = await supabaseClient
            .from("labels_inventory")
            .upsert({
                part_code: partCode,
                supplier_id: supplierId,
                current_full_boxes: inputBoxes,
                current_loose_labels: inputLoose,
                qty_per_box: qtyPerBox 
            }, { onConflict: 'part_code, supplier_id' });

        if (upsertError) throw upsertError;

        await supabaseClient.from("activity_log").insert({
            user_id: currentUser?.id || null,
            username: currentUser?.profile?.username || "unknown_user",
            module: "labels",
            action: "update_stock",
            details: {
                part_code: partCode,
                supplier: supplierName,
                full_boxes: inputBoxes,
                loose_labels: inputLoose,
                calculated_total: calculatedTotal
            }
        });

        closeCustomModal();
        await loadInventoryForPartCode(partCode);

    } catch (err) {
        console.error("Critical Failure processing packaging data sync records:", err);
        alert(`Failed to save update. Details: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit End of Run Count";
    }
}
