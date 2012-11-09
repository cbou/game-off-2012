numberOfRounds = 1000

rounds = []

for i in [1..numberOfRounds]
    round = {
        round: i,
        objects: [
            type: 'tank'
            id: 'tank001',
            position:
                x: 10 + (i / 3)
                y: 100 + (i / 6)
            health:
                100 - (i / 20)
            angle:
                (i / 10)
            cannonAngle:
                (i / 8)
        ],

        events: []
    }

    round.events.push(
        type: 'moving',
        id: 'tank001'
    ) if i == 1

    round.events.push(
        type: 'backwards',
        id: 'tank001'
    ) if i == (numberOfRounds / 2)

    round.events.push(
        type: 'stopped',
        id: 'tank001'
    ) if i == numberOfRounds

    rounds.push(round)

board = $('.board')
game = new Game(board, rounds,
    msPerRound: 3
)
game.initialize()
