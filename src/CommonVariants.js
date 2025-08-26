import React, { useEffect, useState } from 'react';
import { eel } from './App';

const CommonVariants = ({ height = 500, globalFilterTrigger, refreshTrigger }) => {
  const [variantObjects, setVariantObjects] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);

   const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch the sorted variants from the backend
    const fetchVariants = async () => {
      setLoading(true);
      try {
        const variants = await eel.get_sorted_variants_from_db()();
        const totalVariants = variants.reduce((sum, v) => sum + v[1], 0);
        const variantObjs = variants.map(variant => ({
          sequence: variant[0],
          count: variant[1],
          percentage: ((variant[1] / totalVariants) * 100).toFixed(1) + '%'
        }));
        setVariantObjects(variantObjs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching variants:', error);
      }
    };

    fetchVariants();
  }, [refreshTrigger]);

  const handleVariantClick = async (sequence) => {
    let updatedSelection;
    if (selectedVariants.includes(sequence)) {
      // Deselect the variant
      updatedSelection = selectedVariants.filter(variant => variant !== sequence);
    } else {
      // Select the variant
      updatedSelection = [...selectedVariants, sequence];
    }
    setSelectedVariants(updatedSelection);
    await saveSelectedVariantsToBackend(updatedSelection);
  };

  const saveSelectedVariantsToBackend = async (variants) => {
    try {
      // Call the exposed set_filter_value function to save the selected variants
      await eel.set_filter_value("filters.common_variants", variants)();
      globalFilterTrigger();
      console.log("Selected variants saved to backend:", variants);
    } catch (error) {
      console.error("Failed to save selected variants to backend:", error);
    }
  };

  return (
     <div style={{ position: 'relative'}}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(30,30,30,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div className="spinner" />
        </div>
      )}
      <div style={{ width: '100%', height: height, overflowY: 'auto' }}>
        {variantObjects.map((variant) => (
          <div
            key={variant.sequence}
            className="variant"
            style={{
              padding: '5px',
              margin: '5px',
              borderBottom: '1px solid #ccc',
              cursor: 'pointer',
              color: 'white',
              backgroundColor: selectedVariants.includes(variant.sequence) ? '#f0f0f0' : null
            }}
            onClick={() => handleVariantClick(variant.sequence)}
          >
            {`${variant.count} (${variant.percentage}) - ${variant.sequence}`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommonVariants;
