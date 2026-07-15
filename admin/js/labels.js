// ===============================================
// THOR DISPLAY CMS - PACKAGING LOGIC MATRIX 
// Label Inventory Management Script Controller
// ===============================================

let masterSuppliersList = [];
let selectedPartCodeData = [];
let cachedPartCodesArray = [];
let fullInventoryBalancesSnapshot = [];
let activeLowStockItemsList = [];

/**
 * Main Initialization Lifecycle Module Router Hook
 */
async function initLabelsPage() {
    console.log("Initializing Gated Labels Inventory Controller System...");
    
    // Evaluate if the logged-in personnel holds access permissions via global userPermissions map
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

    // 3. Refresh Catalog Matrix, Dropdown Layouts, and Cache Indicators
    await refreshPartCodesCatalogDropdown();
    await buildGlobalInventoryCacheSnapshot();

    // 4. Bind Reactive UI Dynamic Click & Change Receivers
    bindLabelEventHandlers();
}

/**
 * Validates active session metadata credentials against required permission scopes
 * Allowed roles: Super Admin (1), Staff (2), Operator (3)
 */
function evaluateLabelUpdatePermissions() {
    if (!currentUser) return false;

    const userRoleId = currentUser.profile?.role_id;
    if (userRoleId === 1 || userRoleId === 2 || userRoleId === 3) {
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
    if (userRoleId === 2) roleText = "Staff";
    
    container.innerHTML = `
        <div class="inv-badge" style="background:#ffffff; border:2px solid #cbd5e1; padding:8px 14px; border-radius:6px; text-align:right;">
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">👤 ${displayName}</div>
            <div style="font-size: 11px; font-weight:600; color: #64748b; margin-top: 1px;">${roleText.toUpperCase()} • ${currentShift}</div>
        </div>
    `;
    
    // STRICT SECURITY: Catalog mechanics visible ONLY to Super Admin (Role ID 1)
    if (adminPanel) {
        if (userRoleId === 1) {
            adminPanel.style.display = "block";
        } else {
            adminPanel.style.display = "none";
        }
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
    const userRoleId = currentUser.profile?.role_id;
    if (userRoleId !== 1) {
        alert("Action Revoked: Only System Administrators possess catalog design rights.");
        return;
    }

    const supplierName = prompt("Enter the name of the new label supplier line:\n(e.g., Prodigy, Northern, Apex Packaging)");
    if (!supplierName || !supplierName.trim()) return;

    const qtyText = prompt(`Enter standard fallback label quantity packed inside one full box for ${supplierName.trim()}:`, "6000");
    if (qtyText === null) return;
    const qtyPerBox = parseInt(qtyText, 10) || 6000;

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
        cachedPartCodesArray = loadedPartCodes;
        populateSearchableComboOptions(loadedPartCodes);
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

/**
 * Advanced Searchable Combo Combobox Component Processing Matrix
 */
function populateSearchableComboOptions(partCodes) {
    const dropdown = document.getElementById("part-combo-dropdown");
    if (!dropdown) return;

    if (partCodes.length === 0) {
        dropdown.innerHTML = '<div class="combo-no-results">No Part Codes Configured</div>';
        return;
    }

    dropdown.innerHTML = "";
    partCodes.forEach(item => {
        const div = document.createElement("div");
        div.className = "combo-item";
        div.dataset.value = item.part_code;
        div.textContent = `${item.part_code} - ${item.label_name}`;
        div.onclick = function() {
            selectComboValue(item.part_code, `${item.part_code} - ${item.label_name}`);
        };
        dropdown.appendChild(div);
    });
}

window.showComboDropdown = function() {
    document.getElementById("part-combo-dropdown").style.display = "block";
};

// Auto-dismiss combobox overlay window layouts when clicking out of boundaries
document.addEventListener("click", function(e) {
    const wrapper = document.querySelector(".combo-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById("part-combo-dropdown").style.display = "none";
    }
});

window.filterComboOptions = function() {
    const query = document.getElementById("part-combo-input").value.toLowerCase().trim();
    const dropdown = document.getElementById("part-combo-dropdown");
    const items = dropdown.getElementsByClassName("combo-item");
    let visibleCount = 0;

    dropdown.style.display = "block";

    for (let i = 0; i < items.length; i++) {
        const text = items[i].textContent.toLowerCase();
        if (text.includes(query)) {
            items[i].style.display = "block";
            visibleCount++;
        } else {
            items[i].style.display = "none";
        }
    }

    const existingNoRes = dropdown.querySelector(".combo-no-results");
    if (existingNoRes) existingNoRes.remove();

    if (visibleCount === 0) {
        const noRes = document.createElement("div");
        noRes.className = "combo-no-results";
        noRes.textContent = "No matching part codes found";
        dropdown.appendChild(noRes);
    }
};

window.selectComboValue = async function(val, labelText) {
    document.getElementById("part-combo-input").value = labelText;
    document.getElementById("part-code-selector").value = val;
    document.getElementById("part-combo-dropdown").style.display = "none";
    
    document.getElementById("view-page-search").value = "";
    await loadInventoryForPartCode(val);
};

function bindLabelEventHandlers() {
    // Blank implementation as forms are updated on-the-fly inside transaction actions now.
}

/**
 * Pulls, Concat-Maps, and Displays Complete Multi-Supplier Inventory State Matrix Records
 */
async function loadInventoryForPartCode(partCode) {
    const rootContainer = document.getElementById("inventory-display-root");
    const labelTitle = document.getElementById("display-label-name");
    const tableBody = document.getElementById("inventory-table-body");
    
    if (!rootContainer || !labelTitle || !tableBody) return;
    
    const userRoleId = currentUser.profile?.role_id;
    // Everyone verified has rights to trigger inventory modifications
    const canModify = (userRoleId === 1 || userRoleId === 3 || userRoleId === 2);

    document.getElementById("table-action-header").style.display = canModify ? "" : "none";
    document.getElementById("table-action-footer").style.display = canModify ? "" : "none";

    const matchedPart = cachedPartCodesArray.find(p => p.part_code === partCode);
    if (!matchedPart) return;
    labelTitle.textContent = `${matchedPart.part_code} - ${matchedPart.label_name}`;

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

    const applicableSuppliers = masterSuppliersList.filter(s => 
        selectedPartCodeData.some(r => r.supplier_id === s.id)
    );

    const linesToRender = applicableSuppliers.length > 0 ? applicableSuppliers : masterSuppliersList;

    linesToRender.forEach(supplier => {
        const record = selectedPartCodeData.find(r => r.supplier_id === supplier.id) || {
            current_full_boxes: 0,
            current_loose_labels: 0,
            qty_per_box: supplier.qty_per_box
        };

        const effectiveQtyPerBox = record.qty_per_box ? record.qty_per_box : supplier.qty_per_box;
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

    rootContainer.style.display = "block";
}

/**
 * Builds standard flat arrays tracking full inventory levels to calculate system exceptions
 */
async function buildGlobalInventoryCacheSnapshot() {
    try {
        const { data: allInventory, error: invErr } = await supabaseClient.from("labels_inventory").select("*");
        if (invErr) throw invErr;
        
        fullInventoryBalancesSnapshot = allInventory || [];
        evaluatePlantLowStockSafetyThresholds();
    } catch (err) {
        console.error("Failed building memory audit arrays:", err);
    }
}

/**
 * Evaluates stock counts across variables to catch drops beneath parameters
 */
function evaluatePlantLowStockSafetyThresholds() {
    activeLowStockItemsList = [];
    
    cachedPartCodesArray.forEach(part => {
        const associatedRecords = fullInventoryBalancesSnapshot.filter(r => r.part_code === part.part_code);
        
        let totalCalculatedLabels = 0;
        let minimumAllowedSetpoint = 30000;
        
        if (associatedRecords.length > 0) {
            minimumAllowedSetpoint = associatedRecords[0].min_setpoint;
            associatedRecords.forEach(rec => {
                totalCalculatedLabels += (rec.current_full_boxes * rec.qty_per_box) + rec.current_loose_labels;
            });
        }
        
        if (totalCalculatedLabels <= minimumAllowedSetpoint) {
            activeLowStockItemsList.push({
                part_code: part.part_code,
                label_name: part.label_name,
                current_stock: totalCalculatedLabels,
                min_setpoint: minimumAllowedSetpoint
            });
        }
    });

    const warningTriggerBtn = document.getElementById("low-stock-summary-trigger");
    const warningCountBadge = document.getElementById("low-stock-summary-count");
    
    if (warningTriggerBtn && warningCountBadge) {
        if (activeLowStockItemsList.length > 0) {
            warningCountBadge.textContent = activeLowStockItemsList.length;
            warningTriggerBtn.style.display = "block";
        } else {
            warningTriggerBtn.style.display = "none";
        }
    }
}

/**
 * Opens detailed low stock display lists
 */
window.openLowStockSummaryModal = function() {
    const tbody = document.getElementById("low-stock-modal-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    if (activeLowStockItemsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;">No items currently below safety rules.</td></tr>`;
    } else {
        activeLowStockItemsList.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="font-weight:700; color:#dc2626;">${item.part_code}</td>
                <td style="font-weight:600; color:#1e293b;">${item.label_name}</td>
                <td style="text-align:right; font-weight:700; color:#b91c1c;">${item.current_stock.toLocaleString()}</td>
                <td style="text-align:right; font-weight:600; color:#64748b;">${item.min_setpoint.toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    document.getElementById("lowStockItemsModalContainer").style.display = "block";
};

window.closeLowStockModal = function() {
    document.getElementById("lowStockItemsModalContainer").style.display = "none";
};

/**
 * Global Instant Filter Event Router Lookups
 */
window.executeViewPageGlobalSearch = function() {
    const searchQuery = document.getElementById("view-page-search").value.toLowerCase().trim();
    if (!searchQuery) return;
    
    const optimalMatch = cachedPartCodesArray.find(p => 
        p.part_code.toLowerCase().includes(searchQuery) || 
        p.label_name.toLowerCase().includes(searchQuery)
    );
    
    if (optimalMatch) {
        document.getElementById("part-combo-input").value = `${optimalMatch.part_code} - ${optimalMatch.label_name}`;
        document.getElementById("part-code-selector").value = optimalMatch.part_code;
        loadInventoryForPartCode(optimalMatch.part_code);
    }
};

/**
 * Native Browser XML Spreadsheet Export Generation Utility
 */
window.generateDatabaseExcelExport = function() {
    let excelRowsXML = "";
    
    excelRowsXML += `
        <tr>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Part Code</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Label Title Description</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Supplier Line Channel</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Full Sealed Boxes</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Loose Pieces Count</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Box Base Calibration</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Total Item Stock Balance</th>
            <th style="background-color: #0f172a; color: #ffffff; font-weight: bold;">Safety Setpoint Target</th>
        </tr>
    `;

    cachedPartCodesArray.forEach(part => {
        const associatedRecords = fullInventoryBalancesSnapshot.filter(r => r.part_code === part.part_code);
        
        if (associatedRecords.length === 0) {
            excelRowsXML += `
                <tr>
                    <td>${part.part_code}</td>
                    <td>${part.label_name}</td>
                    <td>No Associated Records</td>
                    <td>0</td>
                    <td>0</td>
                    <td>6000</td>
                    <td>0</td>
                    <td>30000</td>
                </tr>
            `;
        } else {
            associatedRecords.forEach(rec => {
                const supplierObj = masterSuppliersList.find(s => s.id === rec.supplier_id);
                const supplierNameStr = supplierObj ? supplierObj.supplier_name : `Line Link ID #${rec.supplier_id}`;
                const computedBalanceSum = (rec.current_full_boxes * rec.qty_per_box) + rec.current_loose_labels;
                
                excelRowsXML += `
                    <tr>
                        <td>${part.part_code}</td>
                        <td>${part.label_name}</td>
                        <td>${supplierNameStr}</td>
                        <td>${rec.current_full_boxes}</td>
                        <td>${rec.current_loose_labels}</td>
                        <td>${rec.qty_per_box}</td>
                        <td>${computedBalanceSum}</td>
                        <td>${rec.min_setpoint}</td>
                    </tr>
                `;
            });
        }
    });

    const blobTemplateWrapper = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Label Plant Inventory</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table border="1">${excelRowsXML}</table></body>
        </html>
    `;

    const blobDataInstance = new Blob([blobTemplateWrapper], { type: "application/vnd.ms-excel" });
    const downloadUrlAnchor = window.URL.createObjectURL(blobDataInstance);
    const hiddenTriggerElement = document.createElement("a");
    
    hiddenTriggerElement.href = downloadUrlAnchor;
    hiddenTriggerElement.download = `LABEL_INVENTORY_AUDIT_SHEET_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(hiddenTriggerElement);
    hiddenTriggerElement.click();
    document.body.removeChild(hiddenTriggerElement);
};

/**
 * ENGINEERING TOOL: Adds a Brand New 4-Digit Part Code and maps specific custom Qty / Box counts
 */
window.submitNewCatalogPartCode = async function() {
    const userRoleId = currentUser.profile?.role_id;
    if (userRoleId !== 1) {
        alert("Unauthorized action execution barred.");
        return;
    }

    const codeInput = document.getElementById("new-part-code");
    const nameInput = document.getElementById("new-label-name");
    const minStockInput = document.getElementById("new-min-stock");
    
    if (!codeInput || !nameInput || !minStockInput) return;

    const partCode = codeInput.value.trim();
    const labelName = nameInput.value.trim();
    const parsedMinStock = parseInt(minStockInput.value, 10);
    const minSetpoint = isNaN(parsedMinStock) ? 30000 : parsedMinStock;

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
            const suppId = parseInt(box.value, 10);
            const qtyBoxInput = document.querySelector(`.supplier-box-qty-input[data-supplier-id="${suppId}"]`);
            
            let customQty = qtyBoxInput ? parseInt(qtyBoxInput.value, 10) : 0;
            if (!customQty || isNaN(customQty)) {
                const matchedSupp = masterSuppliersList.find(s => s.id === suppId);
                customQty = matchedSupp ? matchedSupp.qty_per_box : 6000;
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

        alert("Success: Part code " + partCode + " initialized perfectly.");
        codeInput.value = "";
        nameInput.value = "";
        minStockInput.value = "30000"; 
        
        await refreshPartCodesCatalogDropdown();
        await buildGlobalInventoryCacheSnapshot();
        selectComboValue(partCode, `${partCode} - ${labelName}`);

    } catch (err) {
        console.error("Critical failure during catalog insert:", err);
        alert(`Failed to save code. Custom Details: ${err.message}`);
    }
};

/**
 * ENGINEERING TOOL: Purges Selected Part Code records
 */
window.deleteCurrentSelectedPartCode = async function() {
    const userRoleId = currentUser.profile?.role_id;
    if (userRoleId !== 1) {
        alert("Action Denied.");
        return;
    }

    const selectedCode = document.getElementById("part-code-selector").value;
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
        document.getElementById("part-combo-input").value = "";
        document.getElementById("part-code-selector").value = "";
        
        await refreshPartCodesCatalogDropdown();
        await buildGlobalInventoryCacheSnapshot();

    } catch (err) {
        console.error("Critical cascade purge failure:", err);
        alert(`Failed to execute clear commands: ${err.message}`);
    }
};

/**
 * Prepares and displays the color-coded three-column modal with precise field scoping
 */
window.openUpdateModal = function(partCode, supplierId, supplierName, currentBoxes, currentLoose, effectiveQtyPerBox) {
    document.getElementById("modal-part-code").value = partCode;
    document.getElementById("modal-supplier-id").value = supplierId;
    document.getElementById("modal-supplier-name").value = supplierName;
    document.getElementById("modal-qty-per-box").value = effectiveQtyPerBox;
    
    // Store current counts for differential logic computations
    document.getElementById("modal-current-boxes").value = currentBoxes;
    document.getElementById("modal-current-loose").value = currentLoose;
    
    const currentLabelsSum = (currentBoxes * effectiveQtyPerBox) + currentLoose;
    document.getElementById("modal-current-balance-badge").textContent = currentLabelsSum.toLocaleString();
    document.getElementById("modal-box-qty-badge").textContent = effectiveQtyPerBox.toLocaleString();
    document.getElementById("modal-title-text").textContent = `Configure Run Stock: ${partCode} (${supplierName})`;
    
    // Reset/Clear inputs across all operations columns
    document.getElementById("add-input-boxes").value = "";
    document.getElementById("deduct-input-boxes").value = "";
    document.getElementById("deduct-input-loose").value = "";
    document.getElementById("correct-input-boxes").value = currentBoxes;
    document.getElementById("correct-input-loose").value = currentLoose;

    // Evaluate Role-Based UI Gate Access visibility
    const userRoleId = currentUser.profile?.role_id; // 1: Admin, 2: Staff, 3: Operator
    
    const colAdd = document.getElementById("col-add-stock-container");
    const colDeduct = document.getElementById("col-deduct-stock-container");
    const colCorrect = document.getElementById("col-correct-stock-container");

    if (userRoleId === 3) {
        // Operators ONLY see Column 2 (Deduction)
        if (colAdd) colAdd.style.display = "none";
        if (colDeduct) colDeduct.style.display = "flex";
        if (colCorrect) colCorrect.style.display = "none";
    } else {
        // Staff and Admins see ALL 3 columns
        if (colAdd) colAdd.style.display = "flex";
        if (colDeduct) colDeduct.style.display = "flex";
        if (colCorrect) colCorrect.style.display = "flex";
    }

    document.getElementById("customUpdateModalContainer").style.display = "block";
};

window.closeCustomModal = function() {
    document.getElementById("customUpdateModalContainer").style.display = "none";
};

/**
 * Handles transactional processing logic across all three action states
 * Action: 'add' (adds stock), 'deduct' (subtracts stock), 'correct' (force overrides)
 * Integrates OPTION A (Auto-Convert) logic for loose inputs.
 */
window.processStockTransaction = async function(action) {
    const submitAdd = document.getElementById("btn-submit-add");
    const submitDeduct = document.getElementById("btn-submit-deduct");
    const submitCorrect = document.getElementById("btn-submit-correct");

    const disableButtons = (status) => {
        if (submitAdd) { submitAdd.disabled = status; if (status) submitAdd.textContent = "..."; else submitAdd.textContent = "📥 Add To Stock"; }
        if (submitDeduct) { submitDeduct.disabled = status; if (status) submitDeduct.textContent = "..."; else submitDeduct.textContent = "📤 Deduct Used Stock"; }
        if (submitCorrect) { submitCorrect.disabled = status; if (status) submitCorrect.textContent = "..."; else submitCorrect.textContent = "💾 Force Correct Stock"; }
    };

    const partCode = document.getElementById("modal-part-code").value;
    const supplierId = parseInt(document.getElementById("modal-supplier-id").value, 10);
    const supplierName = document.getElementById("modal-supplier-name").value;
    const qtyPerBox = parseInt(document.getElementById("modal-qty-per-box").value, 10) || 6000;
    
    const currentBoxes = parseInt(document.getElementById("modal-current-boxes").value, 10) || 0;
    const currentLoose = parseInt(document.getElementById("modal-current-loose").value, 10) || 0;
    const initialTotal = (currentBoxes * qtyPerBox) + currentLoose;

    let targetBoxes = currentBoxes;
    let targetLoose = currentLoose;
    let logDeltaText = "";
    let autoConvertNotice = "";

    if (action === 'add') {
        const addedBoxesInput = document.getElementById("add-input-boxes").value;
        const boxesToAdd = parseInt(addedBoxesInput, 10) || 0;
        
        if (boxesToAdd <= 0) {
            alert("Input Error: Please enter a valid number of boxes to add (minimum 1).");
            return;
        }
        
        targetBoxes = currentBoxes + boxesToAdd;
        targetLoose = currentLoose; // Keep current loose labels intact
        logDeltaText = `Added ${boxesToAdd} new boxes.`;

    } else if (action === 'deduct') {
        const inputBoxesDeduct = parseInt(document.getElementById("deduct-input-boxes").value, 10) || 0;
        const inputLooseDeduct = parseInt(document.getElementById("deduct-input-loose").value, 10) || 0;
        const totalDeductionQuantity = (inputBoxesDeduct * qtyPerBox) + inputLooseDeduct;

        if (totalDeductionQuantity <= 0) {
            alert("Input Error: Please specify boxes or loose labels consumed during this run.");
            return;
        }

        // Logic to prevent running negative stock balances
        if (totalDeductionQuantity > initialTotal) {
            const allowForceDeduct = confirm(
                `⚠️ Warning: Your deduction of ${totalDeductionQuantity.toLocaleString()} labels is greater than our current warehouse balance of ${initialTotal.toLocaleString()} labels.\n\n` + 
                `Click 'OK' if you want to set stock counts to zero, or click 'Cancel' to adjust your inputs.`
            );
            if (!allowForceDeduct) return;
            
            targetBoxes = 0;
            targetLoose = 0;
        } else {
            // Deduct from total label quantities, automatically keeping loose limits normalized
            const finalTotalRemaining = initialTotal - totalDeductionQuantity;
            targetBoxes = Math.floor(finalTotalRemaining / qtyPerBox);
            targetLoose = finalTotalRemaining % qtyPerBox;
        }
        
        logDeltaText = `Subtracted ${totalDeductionQuantity} labels (${inputBoxesDeduct} boxes, ${inputLooseDeduct} loose) used on production run.`;

    } else if (action === 'correct') {
        // Explicitly parse inputs as Base-10 Integers to prevent string concatenation/comparison bugs
        let forceBoxes = parseInt(document.getElementById("correct-input-boxes").value, 10);
        let forceLoose = parseInt(document.getElementById("correct-input-loose").value, 10);

        if (isNaN(forceBoxes) || isNaN(forceLoose) || forceBoxes < 0 || forceLoose < 0) {
            alert("Input Error: Force correction counts must be valid positive numbers.");
            return;
        }

        // OPTION A AUTO-CONVERT: Safely compare as numbers
        if (forceLoose >= qtyPerBox) {
            const extraBoxes = Math.floor(forceLoose / qtyPerBox);
            const remainingLoose = forceLoose % qtyPerBox;
            
            autoConvertNotice = `\n\n💡 Auto-Convert Action:\nYour input of ${forceLoose.toLocaleString()} loose labels has been normalized to ${extraBoxes} full box(es) and ${remainingLoose.toLocaleString()} loose.`;
            
            forceBoxes += extraBoxes;
            forceLoose = remainingLoose;
        }

        const forceTotal = (forceBoxes * qtyPerBox) + forceLoose;
        
        // Confirmation Warning Interlock Dialog
        const confirmForce = confirm(
            `⚠️ FORCE STOCK CORRECTION OVERRIDE:\n\n` +
            `Are you absolutely sure you want to force overwrite the inventory balance for Part Code "${partCode}" under ${supplierName}?\n\n` +
            `• Current Balance: ${initialTotal.toLocaleString()} labels (${currentBoxes} boxes, ${currentLoose} loose)\n` +
            `• Corrected Balance: ${forceTotal.toLocaleString()} labels (${forceBoxes} boxes, ${forceLoose} loose)${autoConvertNotice}\n\n` +
            `This action will overwrite the database directly.`
        );
        if (!confirmForce) return;

        targetBoxes = forceBoxes;
        targetLoose = forceLoose;
        logDeltaText = `Force stock override from ${initialTotal} labels to ${forceTotal} labels (Normalized: ${forceBoxes} boxes, ${forceLoose} loose).`;
    }

    const calculatedTotal = (targetBoxes * qtyPerBox) + targetLoose;

    try {
        disableButtons(true);

        const { error: upsertError } = await supabaseClient
            .from("labels_inventory")
            .upsert({
                part_code: partCode,
                supplier_id: supplierId,
                current_full_boxes: targetBoxes,
                current_loose_labels: targetLoose,
                qty_per_box: qtyPerBox 
            }, { onConflict: 'part_code, supplier_id' });

        if (upsertError) throw upsertError;

        // Save detailed logging entries to activity_log
        await supabaseClient.from("activity_log").insert({
            user_id: currentUser?.id || null,
            username: currentUser?.profile?.username || "unknown_user",
            module: "labels",
            action: `stock_${action}`,
            details: {
                part_code: partCode,
                supplier: supplierName,
                action_type: action,
                full_boxes_saved: targetBoxes,
                loose_labels_saved: targetLoose,
                calculated_total_saved: calculatedTotal,
                notes: logDeltaText,
                original_total: initialTotal
            }
        });

        closeCustomModal();
        await loadInventoryForPartCode(partCode);
        await buildGlobalInventoryCacheSnapshot();

    } catch (err) {
        console.error("Critical Failure processing packaging data transaction:", err);
        alert(`Failed to save update. Details: ${err.message}`);
    } finally {
        disableButtons(false);
    }
};
