module.exports = {
  model: 'PMC340',
  vendor: 'CET Inc.',
  description: 'Energy meter',
  supports: 'voltage, current, power, pf, var',
  fromModbus: {
    keep: {
      Uan: {
        address: 0,
        length: 2,
        type: 'float'
      },
      Ubn: {
        address: 2,
        length: 2,
        type: 'float'
      },
      Ucn: {
        address: 4,
        length: 2,
        type: 'float'
      },
      UInAvg: {
        address: 6,
        length: 2,
        type: 'float'
      },
      Uab: {
        address: 8,
        length: 2,
        type: 'float'
      },
      Ubc: {
        address: 10,
        length: 2,
        type: 'float'
      },
      Uca: {
        address: 12,
        length: 2,
        type: 'float'
      },
      Ia: {
        address: 16,
        length: 2,
        type: 'float'
      },
      Ib: {
        address: 18,
        length: 2,
        type: 'float'
      },
      Ic: {
        address: 20,
        length: 2,
        type: 'float'
      },
      Iavg: {
        address: 22,
        length: 2,
        type: 'float'
      },
      kWa: {
        address: 24,
        length: 2,
        type: 'float'
      },
      kWb: {
        address: 26,
        length: 2,
        type: 'float'
      },
      kWc: {
        address: 28,
        length: 2,
        type: 'float'
      },
      kWtotal: {
        address: 30,
        length: 2,
        type: 'float'
      },
      kVARa: {
        address: 32,
        length: 2,
        type: 'float'
      },
      kVARb: {
        address: 34,
        length: 2,
        type: 'float'
      },
      kVARb: {
        address: 36,
        length: 2,
        type: 'float'
      },
      kVARtotal: {
        address: 38,
        length: 2,
        type: 'float'
      },
      kVAa: {
        address: 40,
        length: 2,
        type: 'float'
      },
      kVAb: {
        address: 42,
        length: 2,
        type: 'float'
      },
      kVAc: {
        address: 44,
        length: 2,
        type: 'float'
      },
      kVAtotal: {
        address: 46,
        length: 2,
        type: 'float'
      },
      PFa: {
        address: 48,
        length: 2,
        type: 'float'
      },
      PFb: {
        address: 50,
        length: 2,
        type: 'float'
      },
      PFc: {
        address: 52,
        length: 2,
        type: 'float'
      },
      PFtotal: {
        address: 54,
        length: 2,
        type: 'float'
      }
      ,
      Frequency: {
        address: 56,
        length: 2,
        type: 'float'
      }
    }
  },
  toModbus: {}
};