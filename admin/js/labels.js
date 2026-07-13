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
        await buildGlobalInventoryCacheSnapshot();

    } catch (err) {
        console.error("Critical Failure processing packaging data sync records:", err);
        alert(`Failed to save update. Details: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit End of Run Count";
    }
}
