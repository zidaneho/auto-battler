import React from 'react';
import { Unit } from '@/units/Unit';
import { BaseItemComponent } from '@/items/BaseItemComponent';

interface UnitItemsPanelProps {
  unit: Unit | null;
}

const UnitItemsPanel: React.FC<UnitItemsPanelProps> = ({ unit }) => {
  if (!unit) {
    return null;
  }

  const items = unit.gameObject.components.filter(
    (c) => c instanceof BaseItemComponent
  ) as BaseItemComponent[];

  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{
      width: '280px',
      backgroundColor: 'rgba(45, 55, 72, 0.85)',
      color: '#e2e8f0',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: '14px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      border: '1px solid #4a5568',
    }}>
      <div style={{ borderBottom: '1px solid #718096', paddingBottom: '8px', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Equipped Items</h3>
      </div>
      <div>
        {items.map((itemComp, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <p><strong>{itemComp.blueprint.name}</strong></p>
            <p>{itemComp.blueprint.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitItemsPanel;