const Task = Mep.require('strategy/Task');
const TunedPoint = Mep.require('strategy/TunedPoint');
const TunedAngle = Mep.require('strategy/TunedAngle');
const starter = Mep.getDriver('StarterDriver');
const Delay = Mep.require('misc/Delay');
const Point = Mep.require('misc/Point');
const lunar = Mep.getDriver('LunarCollector');
const Console = require('./Console');

const TAG = 'InitTask';

class InitTask extends Task {
    async onRun() {
        // Mep.getDriver('MotionDriver').softStop();
        Mep.getDriver('ServoLimiter').setPosition(560);
        await starter.waitStartSignal(new Console());

        try {
            await Mep.Motion.go(new TunedPoint(-350, -350), { speed: 70, backward: true });
        } catch (e) {
            Mep.Log.error(TAG, e);
        }

        this.finish();
    }
}

module.exports = InitTask;
