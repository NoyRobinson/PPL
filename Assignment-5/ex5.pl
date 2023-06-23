/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).


% Signature: sub_list(Sublist, List)/2
% Purpose: All elements in Sublist appear in List in the same order.
% Precondition: List is fully instantiated (queries do not include variables in their second argument).

sub_list([], []).
sub_list([X|Xs], [X|Ys]) :- sub_list(Xs, Ys). % take the first element
sub_list(Xs, [_|Ys]) :- sub_list(Xs, Ys). % doesnt take the first element


% Signature: sub_tree(Subtree, Tree)/2
% Purpose: Tree contains Subtree.

sub_tree(void, void).
sub_tree(tree(X, Left, Right), tree(X, Left, Right)). % same tree
sub_tree(X, tree(_, _, Right)) :- sub_tree(X, Right). % subtree of right
sub_tree(X, tree(_, Left, _)) :- sub_tree(X, Left). % subtree of left


% Signature: swap_tree(Tree, InversedTree)/2
% Purpose: InversedTree is the �mirror� representation of Tree.

swap_tree(void, void).
swap_tree(tree(X, Left1, Right1), tree(X, Left2, Right2)) :- swap_tree(Left1,Right2), swap_tree(Left2, Right1)
