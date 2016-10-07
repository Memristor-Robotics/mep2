module.exports = {
    Simulation: true,
    Table: 'table_1_red',

    Drivers: {
        MotionDriver: {
            class: 'drivers/motion/MotionDriver',
            init: true,
            startX: 0,
            startY: 0
        },

        ModbusDriver: {
            class: 'drivers/modbus/ModbusDriver',
            init: true,
        }
    },

    Services: {
        PositionService: {
            class: 'services/position/PositionService',
            init: true,
            moveOptions: {
                pathfinding: false,
                direction: 'forward',
                relative: false,
                tolerance: 3,
                speed: 100
            },
            rotateOptions: {
                relative: false
            }
        },

        TerrainService: {
            class: 'services/position/PositionService',
            init: true,
        }
    }
};
