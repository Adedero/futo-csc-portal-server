function getGradePoints(grade, unit) {
    if (grade.toUpperCase() === 'A') {
        return unit * 5
    }
    if (grade.toUpperCase() === 'B') {
        return unit * 4
    }
    if (grade.toUpperCase() === 'C') {
        return unit * 3
    }
    if (grade.toUpperCase() === 'D') {
        return unit * 2
    }
    if (grade.toUpperCase() === 'E') {
        return unit * 1
    }
    if (grade.toUpperCase() === 'F') {
        return 0
    }

    return 0
}

module.exports = getGradePoints