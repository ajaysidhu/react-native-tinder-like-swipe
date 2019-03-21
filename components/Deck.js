import React from 'react';
import {
    View,
    Text,
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

import PropTypes from 'prop-types';

const size = Dimensions.get('window');
const SWIPE_THRESHOLD = size.width * 0.15;
const SWIPE_OUT_DURATION = 250;

export default class Deck extends React.PureComponent {
    static defaultProps = {
        onSwipeLeft: () => { },
        onSwipeRight: () => { },
        renderNoMoreCards: () => { }
    }
    static propTypes = {
        data: PropTypes.array.isRequired,
        onSwipeLeft: PropTypes.func,
        onSwipeRight: PropTypes.func,
        noMoreCards: PropTypes.func,
        renderItem: PropTypes.elementType
    }
    // static propTypes = {
    //     data: PropTypes.array.isRequired
    // }
    constructor(props) {
        super(props);
        this.state = {
            currentAnimationIndex: 0
        };
        this.position = new Animated.ValueXY();
        this.panresponder = new PanResponder.create({
            //to activate panResponder as soon as user presses on this card
            onStartShouldSetPanResponder: () => true,

            //called anytime user drags the fingers on the card
            onPanResponderMove: (event, gesture) => {
                // debugger;
                // console.log(gesture);
                this.position.setValue({
                    x: gesture.dx,
                    y: gesture.dy
                });
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        //to reset current animation index if data changes
        if (nextProps !== this.props.data) {
            this.setState({
                currentAnimationIndex: 0
            });
        }
    }
    componentWillUpdate() {
        //to make Spring Layout animation on card swipe
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    //to perform swipe complete operations according to swipe direction
    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.currentAnimationIndex];
        (direction === 'right') ? onSwipeRight(item) : onSwipeLeft(item);
        this.position.setValue({ x: 0, y: 0 });
        this.setState({
            currentAnimationIndex: this.state.currentAnimationIndex + 1
        });
    }

    //interpolating x-axix movement into card rotation
    getCardstyle() {
        const rotate = this.position.x.interpolate({
            inputRange: [-size.width * 1.5, 0, size.width * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });
        return {
            ...this.position.getLayout(),
            transform: [{ rotate }]
        };
    }

    //to swipe out card from the screen if user swipes equal to or more than the SWIPE_THRASHOLD
    forceSwipe(direction) {
        Animated.timing(this.position,
            {
                toValue: {
                    x: (direction === 'right') ? size.width : -size.width,
                    y: 0
                },
                duration: SWIPE_OUT_DURATION
            }).start(() => this.onSwipeComplete(direction));
    }

    //to reset crd position if swipes less than the SWIPE_THRASHOLD
    resetPosition() {
        Animated.spring(this.position,
            {
                toValue: {
                    x: 0,
                    y: 0
                }
            }).start();
    }

    renderCards() {
        //to return noMoreCards component if user reached at the end of the stack
        if (this.state.currentAnimationIndex >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

        //to return the stack
        return this.props.data.map((item, index) => {
            //to hide swiped card
            if (index < this.state.currentAnimationIndex) {
                return null;
            }
            //to tranfer animation/panResponder to the top most card in the stack
            if (index === this.state.currentAnimationIndex) {
                return (
                    <Animated.View
                        {...this.panresponder.panHandlers}
                        style={[this.getCardstyle(), styles.cardstyle, { elevation: 1 }]}
                        key={item.id}
                    >
                        {this.props.renderItem(item)}
                    </Animated.View>
                );
            }
            //to render cards below to the top most card
            return (
                <Animated.View
                    key={item.id}
                    style={[
                        styles.cardstyle,
                        {
                            top: 10 * (index - this.state.currentAnimationIndex)
                        }
                    ]}
                >
                    {this.props.renderItem(item)}
                </Animated.View>
            );
        }).reverse();
    }
    render() {
        return (
            <View>
                {/* {this.renderCards()} */}
            </View>
        );
    }
}

const styles = {
    cardstyle: {
        position: 'absolute',
        width: size.width
    }
};
