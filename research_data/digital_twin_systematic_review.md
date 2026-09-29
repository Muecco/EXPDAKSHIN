# Predictive Maintenance Using Digital Twins: A Systematic Literature Review (van Dinter et al., 2022)

## Key Technical Synthesis & Architectural Taxonomy

### 1. Digital Twin Design Patterns
- **Digital Model**: Blueprint for manually developing a physical object (no automated synchronization).
- **Digital Shadow**: Twinning pattern with one-way data flow (physical asset streams telemetry/simulation data to digital representation). Common in NASA bearing & turbofan datasets.
- **Digital Monitor**: Real-time asset condition monitoring, RUL estimation, and anomaly detection while keeping decision-making with operators.
- **Digital Control**: Two-way synchronized twinning enabling remote automated control & feedback loops.

### 2. Predictive Analytics & ML/DL Models
- **Remaining Useful Life (RUL) Estimation**: Primary regression objective for predictive maintenance.
- **Deep Learning Architectures**:
  - **Seq2Seq LSTM Autoencoders**: Learns compressed temporal representation, reconstructs input signals, and uses MSE reconstruction error for unsupervised anomaly detection.
  - **CNNs & Bi-LSTM**: Feature extraction from high-frequency vibration & spectral sensor data.
  - **Generative Adversarial Networks (GANs)**: Generates synthetic failure data when run-to-failure data is scarce.

### 3. Twinning Parameters & Communication Protocols
- **State Parameters**: Vibration (accelerometer), velocity, torque, temperature, active power, current, voltage, mechanical stress.
- **IoT Protocols**: MQTT (publish/subscribe broker-client architecture over TCP/IP), OPC UA (industrial object-oriented communication), Modbus TCP/RTU.
