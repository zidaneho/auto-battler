import React from 'react';
import { Unit } from '@/units/Unit';

interface UnitStatPanelProps {
  unit: Unit | null;
  onClose: () => void;
}

const UnitStatPanel: React.FC<UnitStatPanelProps> = ({ unit, onClose }) => {
  if (!unit) {
    return null;
  }

  // Combine base stats with live stats from components for display
  const { stats, healthComponent, attackComponent } = unit;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      width: '280px',
      backgroundColor: 'rgba(45, 55, 72, 0.85)',
      color: '#e2e8f0',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 20,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: '14px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      border: '1px solid #4a5568',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #718096', paddingBottom: '8px', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>{stats.gameObject.name}</h3>
        <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', padding: '0 5px' }}>
          &times;
        </button>
      </div>
      
      <div>
        <p><strong>Level:</strong> {stats.level}</p>
        <p><strong>Health:</strong> {healthComponent.health.toFixed(0)} / {healthComponent.maxHealth.toFixed(0)}</p>
        <p><strong>Armor:</strong> {healthComponent.armor.toFixed(1)}</p>
        <p><strong>Magic Armor:</strong> {healthComponent.magArmor.toFixed(1)}</p>
        <hr style={{ borderColor: '#4a5568', margin: '8px 0' }} />
        <p><strong>Attack:</strong> {attackComponent.attack.toFixed(1)}</p>
        <p><strong>Magic Power:</strong> {attackComponent.magAttack.toFixed(1)}</p>
        <p><strong>Attack Speed:</strong> {attackComponent.attackSpeed.toFixed(2)}</p>
        <p><strong>Range:</strong> {attackComponent.range.toFixed(1)}</p>
        <p><strong>Crit Chance:</strong> {(attackComponent.critChance * 100).toFixed(0)}%</p>
        <hr style={{ borderColor: '#4a5568', margin: '8px 0' }} />
        <p><strong>Move Speed:</strong> {unit.moveSpeed.toFixed(1)}</p>
      </div>
    </div>
  );
};

export default UnitStatPanel;